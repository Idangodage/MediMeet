import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { corsHeaders, errorResponse, jsonResponse } from "../_shared/http.ts";
import {
  type BillablePlanId,
  type StripeInvoice,
  type StripeSubscription,
  getPlanIdForStripePrice,
  retrieveStripeSubscription
} from "../_shared/stripe.ts";

type StripeEvent = {
  id: string;
  type: string;
  data: {
    object: Record<string, unknown>;
  };
};

type LocalSubscription = {
  id: string;
  clinic_id: string | null;
  doctor_id: string | null;
  provider_customer_id: string | null;
  provider_subscription_id: string | null;
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return errorResponse("Method not allowed.", 405);
  }

  try {
    const signature = request.headers.get("stripe-signature");
    const payload = await request.text();
    const webhookSecret = getRequiredEnv("STRIPE_WEBHOOK_SECRET");

    if (!signature) {
      return errorResponse("Missing Stripe signature.", 400);
    }

    await verifyStripeSignature(payload, signature, webhookSecret);

    const event = JSON.parse(payload) as StripeEvent;
    const serviceClient = createClient(
      getRequiredEnv("SUPABASE_URL"),
      getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY")
    );
    const isDuplicate = await recordWebhookEvent(serviceClient, event, payload);

    if (isDuplicate) {
      return jsonResponse({ received: true, duplicate: true });
    }

    await handleStripeEvent(serviceClient, event);

    return jsonResponse({ received: true });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Webhook failed.", 400);
  }
});

function getRequiredEnv(name: string): string {
  const value = Deno.env.get(name);

  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}

async function recordWebhookEvent(
  serviceClient: ReturnType<typeof createClient>,
  event: StripeEvent,
  payload: string
): Promise<boolean> {
  const { error } = await serviceClient.from("stripe_webhook_events").insert({
    event_type: event.type,
    id: event.id,
    payload: JSON.parse(payload)
  });

  if (!error) {
    return false;
  }

  if (error.code === "23505") {
    return true;
  }

  throw error;
}

async function handleStripeEvent(
  serviceClient: ReturnType<typeof createClient>,
  event: StripeEvent
): Promise<void> {
  if (event.type === "checkout.session.completed") {
    await handleCheckoutCompleted(serviceClient, event.data.object);
    return;
  }

  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    await upsertSubscriptionFromStripe(
      serviceClient,
      event.data.object as StripeSubscription,
      event.type === "customer.subscription.deleted" ? "cancelled" : undefined
    );
    return;
  }

  if (
    event.type === "invoice.payment_succeeded" ||
    event.type === "invoice.payment_failed"
  ) {
    await recordInvoice(serviceClient, event.data.object as StripeInvoice, event.type);
  }
}

async function handleCheckoutCompleted(
  serviceClient: ReturnType<typeof createClient>,
  object: Record<string, unknown>
): Promise<void> {
  const subscriptionId =
    typeof object.subscription === "string" ? object.subscription : null;

  if (!subscriptionId) {
    return;
  }

  const subscription = await retrieveStripeSubscription(subscriptionId);
  subscription.metadata = {
    ...(object.metadata as Record<string, string> | undefined),
    ...(subscription.metadata ?? {})
  };

  if (!subscription.customer && typeof object.customer === "string") {
    subscription.customer = object.customer;
  }

  await upsertSubscriptionFromStripe(serviceClient, subscription);
}

async function upsertSubscriptionFromStripe(
  serviceClient: ReturnType<typeof createClient>,
  subscription: StripeSubscription,
  forcedStatus?: "cancelled"
): Promise<LocalSubscription | null> {
  const owner = await resolveSubscriptionOwner(serviceClient, subscription);

  if (!owner.doctorId && !owner.clinicId) {
    return null;
  }

  const priceId = subscription.items?.data?.[0]?.price?.id;
  const planId =
    normalizePlanId(subscription.metadata?.plan_id) ??
    getPlanIdForStripePrice(priceId) ??
    "free";
  const payload = {
    clinic_id: owner.clinicId,
    current_period_end: unixToIso(subscription.current_period_end),
    current_period_start: unixToIso(subscription.current_period_start),
    doctor_id: owner.doctorId,
    plan_name: planId,
    provider_customer_id: subscription.customer,
    provider_subscription_id: subscription.id,
    status: forcedStatus ?? mapStripeSubscriptionStatus(subscription.status),
    updated_at: new Date().toISOString()
  };
  const { data: existing } = await serviceClient
    .from("subscriptions")
    .select("id")
    .eq("provider_subscription_id", subscription.id)
    .maybeSingle();

  if (existing?.id) {
    const { data, error } = await serviceClient
      .from("subscriptions")
      .update(payload)
      .eq("id", existing.id)
      .select("id, clinic_id, doctor_id, provider_customer_id, provider_subscription_id")
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  const { data, error } = await serviceClient
    .from("subscriptions")
    .insert(payload)
    .select("id, clinic_id, doctor_id, provider_customer_id, provider_subscription_id")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function resolveSubscriptionOwner(
  serviceClient: ReturnType<typeof createClient>,
  subscription: StripeSubscription
): Promise<{ clinicId: string | null; doctorId: string | null }> {
  const metadata = subscription.metadata ?? {};

  if (metadata.doctor_id) {
    return { clinicId: null, doctorId: metadata.doctor_id };
  }

  if (metadata.clinic_id) {
    return { clinicId: metadata.clinic_id, doctorId: null };
  }

  const { data } = await serviceClient
    .from("subscriptions")
    .select("clinic_id, doctor_id")
    .or(
      `provider_subscription_id.eq.${subscription.id},provider_customer_id.eq.${subscription.customer}`
    )
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    clinicId: data?.clinic_id ?? null,
    doctorId: data?.doctor_id ?? null
  };
}

async function recordInvoice(
  serviceClient: ReturnType<typeof createClient>,
  invoice: StripeInvoice,
  eventType: string
): Promise<void> {
  const providerSubscriptionId = extractInvoiceSubscriptionId(invoice);
  let localSubscription: LocalSubscription | null = null;

  if (providerSubscriptionId) {
    const { data } = await serviceClient
      .from("subscriptions")
      .select("id, clinic_id, doctor_id, provider_customer_id, provider_subscription_id")
      .eq("provider_subscription_id", providerSubscriptionId)
      .maybeSingle();
    localSubscription = data;
  }

  if (!localSubscription && invoice.customer) {
    const { data } = await serviceClient
      .from("subscriptions")
      .select("id, clinic_id, doctor_id, provider_customer_id, provider_subscription_id")
      .eq("provider_customer_id", invoice.customer)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    localSubscription = data;
  }

  if (!localSubscription) {
    return;
  }

  const paymentId = extractInvoicePaymentId(invoice);
  const invoicePayload = {
    amount: centsToCurrencyAmount(
      eventType === "invoice.payment_succeeded"
        ? invoice.amount_paid
        : invoice.amount_due
    ),
    clinic_id: localSubscription.clinic_id,
    currency: (invoice.currency ?? "usd").toUpperCase(),
    doctor_id: localSubscription.doctor_id,
    invoice_url: invoice.hosted_invoice_url ?? invoice.invoice_pdf ?? null,
    period_end: unixToIso(extractInvoicePeriodEnd(invoice)),
    period_start: unixToIso(extractInvoicePeriodStart(invoice)),
    provider_invoice_id: invoice.id,
    provider_payment_id: paymentId,
    status: mapStripeInvoiceStatus(invoice.status, eventType),
    subscription_id: localSubscription.id
  };
  const { data: existingInvoice } = await serviceClient
    .from("invoices")
    .select("id")
    .eq("provider_invoice_id", invoice.id)
    .maybeSingle();

  if (existingInvoice?.id) {
    const { error } = await serviceClient
      .from("invoices")
      .update(invoicePayload)
      .eq("id", existingInvoice.id);

    if (error) {
      throw error;
    }
  } else {
    const { error } = await serviceClient.from("invoices").insert(invoicePayload);

    if (error) {
      throw error;
    }
  }

  await recordSubscriptionPayment(serviceClient, localSubscription, invoicePayload);

  if (eventType === "invoice.payment_failed") {
    await notifyPaymentFailure(serviceClient, localSubscription, invoice);
  }
}

async function recordSubscriptionPayment(
  serviceClient: ReturnType<typeof createClient>,
  subscription: LocalSubscription,
  invoicePayload: {
    amount: number;
    clinic_id: string | null;
    currency: string;
    doctor_id: string | null;
    provider_payment_id: string | null;
    status: string;
  }
): Promise<void> {
  const providerPaymentId = invoicePayload.provider_payment_id;

  if (!providerPaymentId) {
    return;
  }

  const paymentPayload = {
    amount: invoicePayload.amount,
    clinic_id: invoicePayload.clinic_id,
    currency: invoicePayload.currency,
    doctor_id: invoicePayload.doctor_id,
    payment_type: "subscription",
    provider: "stripe",
    provider_payment_id: providerPaymentId,
    status: invoicePayload.status === "paid" ? "paid" : "failed"
  };
  const { data: existingPayment } = await serviceClient
    .from("payments")
    .select("id")
    .eq("provider", "stripe")
    .eq("provider_payment_id", providerPaymentId)
    .maybeSingle();

  if (existingPayment?.id) {
    const { error } = await serviceClient
      .from("payments")
      .update(paymentPayload)
      .eq("id", existingPayment.id);

    if (error) {
      throw error;
    }

    return;
  }

  const { error } = await serviceClient.from("payments").insert(paymentPayload);

  if (error) {
    throw error;
  }
}

async function notifyPaymentFailure(
  serviceClient: ReturnType<typeof createClient>,
  subscription: LocalSubscription,
  invoice: StripeInvoice
): Promise<void> {
  if (subscription.doctor_id) {
    const { data: doctor } = await serviceClient
      .from("doctor_profiles")
      .select("user_id")
      .eq("id", subscription.doctor_id)
      .maybeSingle();

    if (doctor?.user_id) {
      await insertNotification(serviceClient, {
        body: "Stripe reported a failed subscription payment. Open billing to update payment details.",
        event: "doctor_subscription_payment_failed",
        title: "Subscription payment failed",
        type: "payment",
        userId: doctor.user_id
      });
    }
  }

  if (subscription.clinic_id) {
    const { data: admins } = await serviceClient
      .from("clinic_admin_memberships")
      .select("user_id")
      .eq("clinic_id", subscription.clinic_id)
      .eq("status", "active");

    for (const admin of admins ?? []) {
      await insertNotification(serviceClient, {
        body: "Stripe reported a failed clinic subscription payment. Open billing to update payment details.",
        event: "clinic_subscription_warning",
        title: "Clinic subscription warning",
        type: "subscription",
        userId: admin.user_id
      });
    }
  }

  const { data: platformAdmins } = await serviceClient
    .from("profiles")
    .select("id")
    .eq("role", "platform_admin");

  for (const admin of platformAdmins ?? []) {
    await insertNotification(serviceClient, {
      body: `Stripe invoice ${invoice.id} failed for a subscription account.`,
      event: "admin_failed_payment_event",
      title: "Failed payment event",
      type: "payment",
      userId: admin.id
    });
  }
}

async function insertNotification(
  serviceClient: ReturnType<typeof createClient>,
  notification: {
    body: string;
    event: string;
    title: string;
    type: string;
    userId: string;
  }
): Promise<void> {
  const { error } = await serviceClient.from("notifications").insert({
    body: notification.body,
    event: notification.event,
    title: notification.title,
    type: notification.type,
    user_id: notification.userId
  });

  if (error) {
    throw error;
  }
}

function normalizePlanId(value: string | undefined): BillablePlanId | null {
  if (value === "basic" || value === "pro" || value === "clinic") {
    return value;
  }

  return null;
}

function mapStripeSubscriptionStatus(status: string): string {
  if (status === "trialing" || status === "active" || status === "past_due") {
    return status;
  }

  if (status === "canceled") {
    return "cancelled";
  }

  if (status === "incomplete_expired") {
    return "expired";
  }

  if (status === "unpaid" || status === "paused" || status === "incomplete") {
    return "suspended";
  }

  return "suspended";
}

function mapStripeInvoiceStatus(
  status: string | null | undefined,
  eventType: string
): string {
  if (eventType === "invoice.payment_succeeded") {
    return "paid";
  }

  if (status === "draft" || status === "open" || status === "void") {
    return status;
  }

  if (status === "paid" || status === "uncollectible") {
    return status;
  }

  return "open";
}

function extractInvoiceSubscriptionId(invoice: StripeInvoice): string | null {
  return (
    invoice.subscription ??
    invoice.parent?.subscription_details?.subscription ??
    invoice.lines?.data?.[0]?.parent?.subscription_item_details?.subscription ??
    null
  );
}

function extractInvoicePaymentId(invoice: StripeInvoice): string | null {
  return invoice.payment_intent ?? invoice.charge ?? invoice.id ?? null;
}

function extractInvoicePeriodStart(invoice: StripeInvoice): number | null | undefined {
  return invoice.period_start ?? invoice.lines?.data?.[0]?.period?.start;
}

function extractInvoicePeriodEnd(invoice: StripeInvoice): number | null | undefined {
  return invoice.period_end ?? invoice.lines?.data?.[0]?.period?.end;
}

function centsToCurrencyAmount(value: number | null | undefined): number {
  return Number(((value ?? 0) / 100).toFixed(2));
}

function unixToIso(value: number | null | undefined): string | null {
  if (!value) {
    return null;
  }

  return new Date(value * 1000).toISOString();
}

async function verifyStripeSignature(
  payload: string,
  signatureHeader: string,
  webhookSecret: string
): Promise<void> {
  const parts = signatureHeader.split(",").reduce<Record<string, string[]>>(
    (accumulator, item) => {
      const [key, value] = item.split("=");

      if (!key || !value) {
        return accumulator;
      }

      accumulator[key] = [...(accumulator[key] ?? []), value];

      return accumulator;
    },
    {}
  );
  const timestamp = parts.t?.[0];
  const signatures = parts.v1 ?? [];

  if (!timestamp || !signatures.length) {
    throw new Error("Invalid Stripe signature header.");
  }

  const timestampSeconds = Number(timestamp);

  if (
    Number.isNaN(timestampSeconds) ||
    Math.abs(Date.now() / 1000 - timestampSeconds) > 300
  ) {
    throw new Error("Stripe signature timestamp is outside tolerance.");
  }

  const expectedSignature = await hmacSha256Hex(
    webhookSecret,
    `${timestamp}.${payload}`
  );
  const isValid = signatures.some((signature) =>
    timingSafeEqualHex(signature, expectedSignature)
  );

  if (!isValid) {
    throw new Error("Stripe signature verification failed.");
  }
}

async function hmacSha256Hex(secret: string, value: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { hash: "SHA-256", name: "HMAC" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));

  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqualHex(left: string, right: string): boolean {
  if (left.length !== right.length) {
    return false;
  }

  let result = 0;

  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return result === 0;
}
