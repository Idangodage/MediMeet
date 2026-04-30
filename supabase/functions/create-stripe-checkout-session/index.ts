import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { corsHeaders, errorResponse, jsonResponse } from "../_shared/http.ts";
import {
  type BillingScope,
  type BillablePlanId,
  createStripeCheckoutSession,
  createStripeCustomer
} from "../_shared/stripe.ts";

type CheckoutRequest = {
  cancelUrl?: string;
  planId?: BillablePlanId;
  scope?: BillingScope;
  successUrl?: string;
};

type BillingOwner = {
  clinicId: string | null;
  customerEmail: string | null;
  customerName: string | null;
  doctorId: string | null;
  ownerUserId: string;
  scope: BillingScope;
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return errorResponse("Method not allowed.", 405);
  }

  try {
    const authHeader = request.headers.get("Authorization");

    if (!authHeader) {
      return errorResponse("Missing authorization header.", 401);
    }

    const body = (await request.json()) as CheckoutRequest;
    const scope = body.scope;
    const planId = body.planId;

    if (!scope || !["doctor", "clinic"].includes(scope)) {
      return errorResponse("Invalid billing scope.", 400);
    }

    if (!planId || !["basic", "pro", "clinic"].includes(planId)) {
      return errorResponse("Invalid subscription plan.", 400);
    }

    if (scope === "doctor" && planId === "clinic") {
      return errorResponse("Doctors can subscribe only to Basic or Pro plans.", 400);
    }

    if (scope === "clinic" && planId !== "clinic") {
      return errorResponse("Clinic admins can subscribe only to the Clinic plan.", 400);
    }

    const supabaseUrl = getRequiredEnv("SUPABASE_URL");
    const anonKey = getRequiredEnv("SUPABASE_ANON_KEY");
    const serviceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    const serviceClient = createClient(supabaseUrl, serviceRoleKey);
    const {
      data: { user },
      error: userError
    } = await authClient.auth.getUser();

    if (userError || !user) {
      return errorResponse("Invalid session.", 401);
    }

    const owner = await resolveBillingOwner(serviceClient, user.id, scope);
    const customerId = await getOrCreateStripeCustomer(serviceClient, owner, planId);
    const defaultReturnUrl =
      scope === "doctor"
        ? "medimeet://doctor/billing"
        : "medimeet://clinic/billing";
    const metadata = {
      owner_user_id: owner.ownerUserId,
      plan_id: planId,
      scope,
      ...(owner.clinicId ? { clinic_id: owner.clinicId } : {}),
      ...(owner.doctorId ? { doctor_id: owner.doctorId } : {})
    };
    const session = await createStripeCheckoutSession({
      cancelUrl: body.cancelUrl ?? defaultReturnUrl,
      customerId,
      metadata,
      planId,
      successUrl: body.successUrl ?? defaultReturnUrl
    });

    if (!session.url) {
      return errorResponse("Stripe did not return a Checkout URL.", 502);
    }

    return jsonResponse({ url: session.url });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Unknown error.", 500);
  }
});

function getRequiredEnv(name: string): string {
  const value = Deno.env.get(name);

  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}

async function resolveBillingOwner(
  serviceClient: ReturnType<typeof createClient>,
  userId: string,
  scope: BillingScope
): Promise<BillingOwner> {
  const { data: profile, error: profileError } = await serviceClient
    .from("profiles")
    .select("id, email, full_name")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    throw new Error("Unable to load billing profile.");
  }

  if (scope === "doctor") {
    const { data: doctor, error } = await serviceClient
      .from("doctor_profiles")
      .select("id, full_name, user_id")
      .eq("user_id", userId)
      .single();

    if (error || !doctor) {
      throw new Error("Complete doctor onboarding before subscribing.");
    }

    return {
      clinicId: null,
      customerEmail: profile.email,
      customerName: doctor.full_name ?? profile.full_name,
      doctorId: doctor.id,
      ownerUserId: userId,
      scope
    };
  }

  const { data: membership, error: membershipError } = await serviceClient
    .from("clinic_admin_memberships")
    .select("clinic_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (membershipError || !membership) {
    throw new Error("You must be an active clinic admin before subscribing.");
  }

  const { data: clinic, error: clinicError } = await serviceClient
    .from("clinics")
    .select("id, name, email")
    .eq("id", membership.clinic_id)
    .single();

  if (clinicError || !clinic) {
    throw new Error("Unable to load clinic billing profile.");
  }

  return {
    clinicId: clinic.id,
    customerEmail: clinic.email ?? profile.email,
    customerName: clinic.name ?? profile.full_name,
    doctorId: null,
    ownerUserId: userId,
    scope
  };
}

async function getOrCreateStripeCustomer(
  serviceClient: ReturnType<typeof createClient>,
  owner: BillingOwner,
  planId: BillablePlanId
): Promise<string> {
  let query = serviceClient
    .from("subscriptions")
    .select("id, provider_customer_id")
    .not("provider_customer_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1);

  query = owner.scope === "doctor"
    ? query.eq("doctor_id", owner.doctorId)
    : query.eq("clinic_id", owner.clinicId);

  const { data: existingRows, error } = await query;

  if (error) {
    throw error;
  }

  const existingCustomerId = existingRows?.[0]?.provider_customer_id;

  if (existingCustomerId) {
    return existingCustomerId;
  }

  const customer = await createStripeCustomer({
    email: owner.customerEmail,
    metadata: {
      owner_user_id: owner.ownerUserId,
      scope: owner.scope,
      ...(owner.clinicId ? { clinic_id: owner.clinicId } : {}),
      ...(owner.doctorId ? { doctor_id: owner.doctorId } : {})
    },
    name: owner.customerName
  });

  const { error: insertError } = await serviceClient.from("subscriptions").insert({
    clinic_id: owner.clinicId,
    doctor_id: owner.doctorId,
    plan_name: planId,
    provider_customer_id: customer.id,
    status: "expired"
  });

  if (insertError) {
    throw insertError;
  }

  return customer.id;
}
