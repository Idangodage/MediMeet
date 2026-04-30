import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { corsHeaders, errorResponse, jsonResponse } from "../_shared/http.ts";
import {
  type BillingScope,
  createStripePortalSession
} from "../_shared/stripe.ts";

type PortalRequest = {
  returnUrl?: string;
  scope?: BillingScope;
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

    const { returnUrl, scope } = (await request.json()) as PortalRequest;

    if (!scope || !["doctor", "clinic"].includes(scope)) {
      return errorResponse("Invalid billing scope.", 400);
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

    const ownerId = await resolveOwnerId(serviceClient, user.id, scope);
    const customerId = await loadStripeCustomerId(serviceClient, ownerId, scope);

    if (!customerId) {
      return errorResponse("No Stripe customer exists for this billing account.", 404);
    }

    const defaultReturnUrl =
      scope === "doctor"
        ? "medimeet://doctor/billing"
        : "medimeet://clinic/billing";
    const session = await createStripePortalSession({
      customerId,
      returnUrl: returnUrl ?? defaultReturnUrl
    });

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

async function resolveOwnerId(
  serviceClient: ReturnType<typeof createClient>,
  userId: string,
  scope: BillingScope
): Promise<string> {
  if (scope === "doctor") {
    const { data, error } = await serviceClient
      .from("doctor_profiles")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      throw new Error("Complete doctor onboarding before opening billing.");
    }

    return data.id;
  }

  const { data, error } = await serviceClient
    .from("clinic_admin_memberships")
    .select("clinic_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (error || !data) {
    throw new Error("You must be an active clinic admin before opening billing.");
  }

  return data.clinic_id;
}

async function loadStripeCustomerId(
  serviceClient: ReturnType<typeof createClient>,
  ownerId: string,
  scope: BillingScope
): Promise<string | null> {
  let query = serviceClient
    .from("subscriptions")
    .select("provider_customer_id")
    .not("provider_customer_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1);

  query = scope === "doctor"
    ? query.eq("doctor_id", ownerId)
    : query.eq("clinic_id", ownerId);

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data?.[0]?.provider_customer_id ?? null;
}
