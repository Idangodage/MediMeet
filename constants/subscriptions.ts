export type SubscriptionPlanId = "free" | "basic" | "pro" | "clinic";

export type SubscriptionPlanLimits = {
  max_locations: number;
  max_monthly_bookings: number;
  analytics_enabled: boolean;
  featured_listing_enabled: boolean;
  reminders_enabled: boolean;
  clinic_management_enabled: boolean;
};

export type SubscriptionPlan = {
  id: SubscriptionPlanId;
  name: string;
  description: string;
  limits: SubscriptionPlanLimits;
};

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlanId, SubscriptionPlan> = {
  free: {
    id: "free",
    name: "Free Plan",
    description:
      "Basic doctor profile, limited monthly booking capacity, and standard visibility.",
    limits: {
      max_locations: 1,
      max_monthly_bookings: 25,
      analytics_enabled: false,
      featured_listing_enabled: false,
      reminders_enabled: false,
      clinic_management_enabled: false
    }
  },
  basic: {
    id: "basic",
    name: "Basic Plan",
    description:
      "Full profile, calendar management, standard booking tools, and more monthly slots.",
    limits: {
      max_locations: 2,
      max_monthly_bookings: 150,
      analytics_enabled: false,
      featured_listing_enabled: false,
      reminders_enabled: false,
      clinic_management_enabled: false
    }
  },
  pro: {
    id: "pro",
    name: "Pro Plan",
    description:
      "Multiple locations, analytics, featured listing eligibility, reminders, and higher booking limits.",
    limits: {
      max_locations: 5,
      max_monthly_bookings: 500,
      analytics_enabled: true,
      featured_listing_enabled: true,
      reminders_enabled: true,
      clinic_management_enabled: false
    }
  },
  clinic: {
    id: "clinic",
    name: "Clinic Plan",
    description:
      "Multiple doctors, clinic dashboard, clinic locations, staff access, and clinic-level billing.",
    limits: {
      max_locations: 50,
      max_monthly_bookings: 10000,
      analytics_enabled: true,
      featured_listing_enabled: true,
      reminders_enabled: true,
      clinic_management_enabled: true
    }
  }
};

export const FREE_PLAN = SUBSCRIPTION_PLANS.free;

export function normalizeSubscriptionPlanId(
  planName: string | null | undefined
): SubscriptionPlanId {
  const normalized = planName?.trim().toLowerCase().replace(/\s+plan$/, "");

  if (normalized === "basic") {
    return "basic";
  }

  if (normalized === "pro") {
    return "pro";
  }

  if (normalized === "clinic") {
    return "clinic";
  }

  return "free";
}

export function getSubscriptionPlan(planId: SubscriptionPlanId): SubscriptionPlan {
  return SUBSCRIPTION_PLANS[planId] ?? FREE_PLAN;
}
