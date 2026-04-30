export type BillingScope = "doctor" | "clinic";
export type BillablePlanId = "basic" | "pro" | "clinic";

export type StripeCustomer = {
  id: string;
};

export type StripeCheckoutSession = {
  id: string;
  url: string | null;
};

export type StripePortalSession = {
  id: string;
  url: string;
};

export type StripeSubscription = {
  id: string;
  customer: string;
  status: string;
  current_period_start?: number | null;
  current_period_end?: number | null;
  metadata?: Record<string, string>;
  items?: {
    data?: Array<{
      price?: {
        id?: string;
      };
    }>;
  };
};

export type StripeInvoice = {
  id: string;
  customer?: string | null;
  subscription?: string | null;
  status?: string | null;
  amount_due?: number | null;
  amount_paid?: number | null;
  currency?: string | null;
  hosted_invoice_url?: string | null;
  invoice_pdf?: string | null;
  payment_intent?: string | null;
  charge?: string | null;
  period_start?: number | null;
  period_end?: number | null;
  parent?: {
    subscription_details?: {
      subscription?: string | null;
    };
  };
  lines?: {
    data?: Array<{
      period?: {
        start?: number | null;
        end?: number | null;
      };
      parent?: {
        subscription_item_details?: {
          subscription?: string | null;
        };
      };
    }>;
  };
};

const STRIPE_API_BASE = "https://api.stripe.com/v1";

export function getStripePriceId(planId: BillablePlanId): string {
  const envNameByPlan: Record<BillablePlanId, string> = {
    basic: "STRIPE_BASIC_PRICE_ID",
    pro: "STRIPE_PRO_PRICE_ID",
    clinic: "STRIPE_CLINIC_PRICE_ID"
  };
  const value = Deno.env.get(envNameByPlan[planId]);

  if (!value) {
    throw new Error(`${envNameByPlan[planId]} is not configured.`);
  }

  return value;
}

export function getPlanIdForStripePrice(priceId?: string | null): BillablePlanId | null {
  if (!priceId) {
    return null;
  }

  const priceIdByPlan: Record<BillablePlanId, string | undefined> = {
    basic: Deno.env.get("STRIPE_BASIC_PRICE_ID"),
    pro: Deno.env.get("STRIPE_PRO_PRICE_ID"),
    clinic: Deno.env.get("STRIPE_CLINIC_PRICE_ID")
  };
  const match = Object.entries(priceIdByPlan).find(
    ([, configuredPriceId]) => configuredPriceId === priceId
  );

  return (match?.[0] as BillablePlanId | undefined) ?? null;
}

export async function createStripeCustomer({
  email,
  metadata,
  name
}: {
  email?: string | null;
  metadata: Record<string, string>;
  name?: string | null;
}): Promise<StripeCustomer> {
  return stripeRequest<StripeCustomer>("/customers", {
    email: email ?? undefined,
    metadata,
    name: name ?? undefined
  });
}

export async function createStripeCheckoutSession({
  cancelUrl,
  customerId,
  metadata,
  planId,
  successUrl
}: {
  cancelUrl: string;
  customerId: string;
  metadata: Record<string, string>;
  planId: BillablePlanId;
  successUrl: string;
}): Promise<StripeCheckoutSession> {
  return stripeRequest<StripeCheckoutSession>("/checkout/sessions", {
    cancel_url: cancelUrl,
    customer: customerId,
    line_items: [
      {
        price: getStripePriceId(planId),
        quantity: 1
      }
    ],
    metadata,
    mode: "subscription",
    subscription_data: {
      metadata
    },
    success_url: successUrl
  });
}

export async function createStripePortalSession({
  customerId,
  returnUrl
}: {
  customerId: string;
  returnUrl: string;
}): Promise<StripePortalSession> {
  return stripeRequest<StripePortalSession>("/billing_portal/sessions", {
    customer: customerId,
    return_url: returnUrl
  });
}

export async function retrieveStripeSubscription(
  subscriptionId: string
): Promise<StripeSubscription> {
  return stripeRequest<StripeSubscription>(
    `/subscriptions/${encodeURIComponent(subscriptionId)}`,
    undefined,
    "GET"
  );
}

async function stripeRequest<T>(
  path: string,
  params?: Record<string, unknown>,
  method: "GET" | "POST" = "POST"
): Promise<T> {
  const secretKey = Deno.env.get("STRIPE_SECRET_KEY");

  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }

  const url = new URL(`${STRIPE_API_BASE}${path}`);
  const init: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${secretKey}`
    }
  };

  if (params && method === "GET") {
    const searchParams = new URLSearchParams();
    appendFormFields(searchParams, params);
    url.search = searchParams.toString();
  }

  if (params && method === "POST") {
    const body = new URLSearchParams();
    appendFormFields(body, params);
    init.body = body;
    init.headers = {
      ...init.headers,
      "Content-Type": "application/x-www-form-urlencoded"
    };
  }

  const response = await fetch(url, init);
  const responseBody = await response.json();

  if (!response.ok) {
    const message =
      responseBody?.error?.message ?? `Stripe request failed with ${response.status}.`;
    throw new Error(message);
  }

  return responseBody as T;
}

function appendFormFields(
  target: URLSearchParams,
  value: Record<string, unknown>,
  prefix?: string
): void {
  Object.entries(value).forEach(([key, entry]) => {
    if (entry === undefined || entry === null) {
      return;
    }

    const fieldName = prefix ? `${prefix}[${key}]` : key;

    if (Array.isArray(entry)) {
      entry.forEach((item, index) => {
        if (typeof item === "object" && item !== null) {
          appendFormFields(
            target,
            item as Record<string, unknown>,
            `${fieldName}[${index}]`
          );
        } else if (item !== undefined && item !== null) {
          target.append(`${fieldName}[${index}]`, String(item));
        }
      });
      return;
    }

    if (typeof entry === "object") {
      appendFormFields(target, entry as Record<string, unknown>, fieldName);
      return;
    }

    target.append(fieldName, String(entry));
  });
}
