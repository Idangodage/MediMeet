import {
  FREE_PLAN,
  getSubscriptionPlan,
  normalizeSubscriptionPlanId,
  type SubscriptionPlan,
  type SubscriptionPlanId
} from "@/constants/subscriptions";
import { getSupabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

export type SubscriptionStatus =
  Database["public"]["Enums"]["subscription_status"];

export type SubscriptionRow =
  Database["public"]["Tables"]["subscriptions"]["Row"];
export type InvoiceRow = Database["public"]["Tables"]["invoices"]["Row"];
export type PaymentRow = Database["public"]["Tables"]["payments"]["Row"];
export type BillingScope = "doctor" | "clinic";
export type BillablePlanId = Exclude<SubscriptionPlanId, "free">;

export type EffectiveSubscription = {
  plan: SubscriptionPlan;
  planId: SubscriptionPlanId;
  sourcePlanId: SubscriptionPlanId;
  status: SubscriptionStatus | "none";
  subscription: SubscriptionRow | null;
  isExpired: boolean;
  isDowngradedToFree: boolean;
  currentPeriodEnd: string | null;
};

export type DoctorSubscriptionContext = EffectiveSubscription & {
  doctorId: string;
};

export type ClinicSubscriptionContext = EffectiveSubscription & {
  clinicId: string | null;
};
export type BillingInvoice = {
  amount: number;
  createdAt: string;
  currency: string;
  id: string;
  invoiceUrl: string | null;
  periodEnd: string | null;
  periodStart: string | null;
  status: InvoiceRow["status"];
};
export type BillingData = {
  invoices: BillingInvoice[];
  subscription: EffectiveSubscription;
};
export type AdminBillingRevenueByPlan = {
  amount: number;
  currency: string;
  planId: SubscriptionPlanId;
  planName: string;
};
export type AdminBillingOverview = {
  activeSubscriptions: number;
  cancelledSubscriptions: number;
  failedPayments: PaymentRow[];
  pastDueSubscriptions: number;
  revenueByPlan: AdminBillingRevenueByPlan[];
  subscriptions: SubscriptionRow[];
  trialUsers: number;
};

const ACTIVE_SUBSCRIPTION_STATUSES: SubscriptionStatus[] = [
  "active",
  "trialing"
];

export async function getOwnDoctorSubscriptionContext(): Promise<
  DoctorSubscriptionContext
> {
  const doctorId = await getOwnDoctorId();
  const subscription = await loadBestSubscription({ doctorId });
  const effectiveSubscription = resolveEffectiveSubscription(subscription);

  return {
    ...effectiveSubscription,
    doctorId
  };
}

export async function getOwnClinicSubscriptionContext(): Promise<
  ClinicSubscriptionContext
> {
  const clinicId = await getOwnClinicId();
  const subscription = clinicId
    ? await loadBestSubscription({ clinicId })
    : null;
  const effectiveSubscription = resolveEffectiveSubscription(subscription);

  return {
    ...effectiveSubscription,
    clinicId
  };
}

export async function getDoctorBillingData(): Promise<BillingData> {
  const subscription = await getOwnDoctorSubscriptionContext();
  const invoices = await listBillingInvoices({
    ownerColumn: "doctor_id",
    ownerId: subscription.doctorId
  });

  return {
    invoices,
    subscription
  };
}

export async function getClinicBillingData(): Promise<BillingData> {
  const subscription = await getOwnClinicSubscriptionContext();

  if (!subscription.clinicId) {
    return {
      invoices: [],
      subscription
    };
  }

  const invoices = await listBillingInvoices({
    ownerColumn: "clinic_id",
    ownerId: subscription.clinicId
  });

  return {
    invoices,
    subscription
  };
}

export async function createStripeCheckoutSessionUrl({
  cancelUrl,
  planId,
  scope,
  successUrl
}: {
  cancelUrl: string;
  planId: BillablePlanId;
  scope: BillingScope;
  successUrl: string;
}): Promise<string> {
  const supabase = getSupabase();
  const { data, error } = await supabase.functions.invoke<{ url: string }>(
    "create-stripe-checkout-session",
    {
      body: {
        cancelUrl,
        planId,
        scope,
        successUrl
      }
    }
  );

  if (error) {
    throw error;
  }

  if (!data?.url) {
    throw new Error("Stripe Checkout URL was not returned.");
  }

  return data.url;
}

export async function createStripePortalSessionUrl({
  returnUrl,
  scope
}: {
  returnUrl: string;
  scope: BillingScope;
}): Promise<string> {
  const supabase = getSupabase();
  const { data, error } = await supabase.functions.invoke<{ url: string }>(
    "create-stripe-portal-session",
    {
      body: {
        returnUrl,
        scope
      }
    }
  );

  if (error) {
    throw error;
  }

  if (!data?.url) {
    throw new Error("Stripe customer portal URL was not returned.");
  }

  return data.url;
}

export async function getAdminBillingOverview(): Promise<AdminBillingOverview> {
  const supabase = getSupabase();
  const { data: subscriptions, error: subscriptionsError } = await supabase
    .from("subscriptions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  if (subscriptionsError) {
    throw subscriptionsError;
  }

  const { data: invoices, error: invoicesError } = await supabase
    .from("invoices")
    .select("*")
    .eq("status", "paid")
    .order("created_at", { ascending: false })
    .limit(500);

  if (invoicesError) {
    throw invoicesError;
  }

  const { data: failedPayments, error: failedPaymentsError } = await supabase
    .from("payments")
    .select("*")
    .eq("status", "failed")
    .order("created_at", { ascending: false })
    .limit(50);

  if (failedPaymentsError) {
    throw failedPaymentsError;
  }

  const subscriptionById = new Map(
    (subscriptions ?? []).map((subscription) => [subscription.id, subscription])
  );
  const revenueMap = new Map<string, AdminBillingRevenueByPlan>();

  (invoices ?? []).forEach((invoice) => {
    const subscription = invoice.subscription_id
      ? subscriptionById.get(invoice.subscription_id)
      : undefined;
    const planId = normalizeSubscriptionPlanId(subscription?.plan_name);
    const key = `${planId}:${invoice.currency}`;
    const current = revenueMap.get(key);

    revenueMap.set(key, {
      amount: (current?.amount ?? 0) + Number(invoice.amount),
      currency: invoice.currency,
      planId,
      planName: getSubscriptionPlan(planId).name
    });
  });

  return {
    activeSubscriptions: (subscriptions ?? []).filter(
      (subscription) => subscription.status === "active"
    ).length,
    cancelledSubscriptions: (subscriptions ?? []).filter(
      (subscription) => subscription.status === "cancelled"
    ).length,
    failedPayments: failedPayments ?? [],
    pastDueSubscriptions: (subscriptions ?? []).filter(
      (subscription) => subscription.status === "past_due"
    ).length,
    revenueByPlan: [...revenueMap.values()].sort((left, right) =>
      left.planName.localeCompare(right.planName)
    ),
    subscriptions: subscriptions ?? [],
    trialUsers: (subscriptions ?? []).filter(
      (subscription) => subscription.status === "trialing"
    ).length
  };
}

export function resolveEffectiveSubscription(
  subscription: SubscriptionRow | null
): EffectiveSubscription {
  if (!subscription) {
    return {
      plan: FREE_PLAN,
      planId: "free",
      sourcePlanId: "free",
      status: "none",
      subscription: null,
      isExpired: false,
      isDowngradedToFree: false,
      currentPeriodEnd: null
    };
  }

  const sourcePlanId = normalizeSubscriptionPlanId(subscription.plan_name);
  const isExpired = isSubscriptionExpired(subscription);
  const isUsable = isSubscriptionUsable(subscription);
  const planId = isUsable ? sourcePlanId : "free";

  return {
    plan: getSubscriptionPlan(planId),
    planId,
    sourcePlanId,
    status: subscription.status,
    subscription,
    isExpired,
    isDowngradedToFree: planId === "free" && sourcePlanId !== "free",
    currentPeriodEnd: subscription.current_period_end
  };
}

export function canCreateMoreSlots(
  subscription: Pick<EffectiveSubscription, "plan">,
  currentMonthlyBookings: number,
  requestedSlots = 1
): boolean {
  return (
    currentMonthlyBookings + requestedSlots <=
    subscription.plan.limits.max_monthly_bookings
  );
}

export function canAddLocation(
  subscription: Pick<EffectiveSubscription, "plan">,
  currentLocations: number,
  requestedLocations = 1
): boolean {
  return (
    currentLocations + requestedLocations <=
    subscription.plan.limits.max_locations
  );
}

export function canViewAnalytics(
  subscription: Pick<EffectiveSubscription, "plan">
): boolean {
  return subscription.plan.limits.analytics_enabled;
}

export function canUseFeaturedListing(
  subscription: Pick<EffectiveSubscription, "plan">
): boolean {
  return subscription.plan.limits.featured_listing_enabled;
}

export function canAccessClinicDashboard(
  subscription: Pick<EffectiveSubscription, "plan">
): boolean {
  return subscription.plan.limits.clinic_management_enabled;
}

async function listBillingInvoices({
  ownerColumn,
  ownerId
}: {
  ownerColumn: "clinic_id" | "doctor_id";
  ownerId: string;
}): Promise<BillingInvoice[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq(ownerColumn, ownerId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    throw error;
  }

  return (data ?? []).map((invoice) => ({
    amount: Number(invoice.amount),
    createdAt: invoice.created_at,
    currency: invoice.currency,
    id: invoice.id,
    invoiceUrl: invoice.invoice_url,
    periodEnd: invoice.period_end,
    periodStart: invoice.period_start,
    status: invoice.status
  }));
}

export async function assertCanCreateMoreSlotsForAvailability({
  availabilityId,
  appointmentDurationMinutes,
  breakMinutes,
  date,
  endTime,
  startTime
}: {
  availabilityId?: string;
  appointmentDurationMinutes: number;
  breakMinutes: number;
  date: string;
  endTime: string;
  startTime: string;
}): Promise<void> {
  const context = await getOwnDoctorSubscriptionContext();
  const requestedSlots = estimateAvailabilitySlotCount({
    appointmentDurationMinutes,
    breakMinutes,
    endTime,
    startTime
  });
  const currentMonthlySlots = await countDoctorMonthlySlots({
    availabilityId,
    doctorId: context.doctorId,
    monthDate: date
  });

  if (!canCreateMoreSlots(context, currentMonthlySlots, requestedSlots)) {
    throw new Error(
      `${context.plan.name} allows ${context.plan.limits.max_monthly_bookings} monthly booking slots. Upgrade before creating more slots for this month.`
    );
  }
}

export async function assertCanSaveDoctorLocation({
  doctorId,
  isActive,
  locationId
}: {
  doctorId: string;
  isActive: boolean;
  locationId?: string;
}): Promise<void> {
  if (!isActive) {
    return;
  }

  const context = await getOwnDoctorSubscriptionContext();

  if (context.doctorId !== doctorId) {
    throw new Error("You can manage locations only for your own doctor profile.");
  }

  const currentActiveLocations = await countDoctorActiveLocations({
    doctorId: context.doctorId,
    excludedLocationId: locationId
  });

  if (!canAddLocation(context, currentActiveLocations, 1)) {
    throw new Error(
      `${context.plan.name} allows ${context.plan.limits.max_locations} active visiting location(s). Upgrade before adding more locations.`
    );
  }
}

export function formatSubscriptionStatus(
  subscription: EffectiveSubscription
): string {
  if (subscription.status === "none") {
    return "Free";
  }

  if (subscription.isDowngradedToFree) {
    return "Downgraded to Free";
  }

  return subscription.status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function loadBestSubscription({
  clinicId,
  doctorId
}: {
  clinicId?: string;
  doctorId?: string;
}): Promise<SubscriptionRow | null> {
  const supabase = getSupabase();
  let query = supabase
    .from("subscriptions")
    .select("*")
    .order("current_period_end", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(20);

  if (doctorId) {
    query = query.eq("doctor_id", doctorId);
  } else if (clinicId) {
    query = query.eq("clinic_id", clinicId);
  } else {
    return null;
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  if (!data.length) {
    return null;
  }

  return [...data].sort(compareSubscriptionsForFeatureAccess)[0] ?? null;
}

async function getOwnDoctorId(): Promise<string> {
  const supabase = getSupabase();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("You must be signed in as a doctor.");
  }

  const { data, error } = await supabase
    .from("doctor_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Complete doctor onboarding before using subscription features.");
  }

  return data.id;
}

async function getOwnClinicId(): Promise<string | null> {
  const supabase = getSupabase();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("You must be signed in as a clinic admin.");
  }

  const { data, error } = await supabase
    .from("clinic_admin_memberships")
    .select("clinic_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.clinic_id ?? null;
}

async function countDoctorMonthlySlots({
  availabilityId,
  doctorId,
  monthDate
}: {
  availabilityId?: string;
  doctorId: string;
  monthDate: string;
}): Promise<number> {
  const supabase = getSupabase();
  const { rangeStart, rangeEnd } = getMonthRange(monthDate);
  const { count, error } = await supabase
    .from("appointment_slots")
    .select("id", { count: "exact", head: true })
    .eq("doctor_id", doctorId)
    .gte("start_time", rangeStart)
    .lt("start_time", rangeEnd);

  if (error) {
    throw error;
  }

  if (!availabilityId) {
    return count ?? 0;
  }

  const { count: existingAvailabilityCount, error: existingError } =
    await supabase
      .from("appointment_slots")
      .select("id", { count: "exact", head: true })
      .eq("availability_id", availabilityId)
      .gte("start_time", rangeStart)
      .lt("start_time", rangeEnd);

  if (existingError) {
    throw existingError;
  }

  return Math.max(0, (count ?? 0) - (existingAvailabilityCount ?? 0));
}

async function countDoctorActiveLocations({
  doctorId,
  excludedLocationId
}: {
  doctorId: string;
  excludedLocationId?: string;
}): Promise<number> {
  const supabase = getSupabase();
  let query = supabase
    .from("doctor_locations")
    .select("id", { count: "exact", head: true })
    .eq("doctor_id", doctorId)
    .eq("is_active", true);

  if (excludedLocationId) {
    query = query.neq("id", excludedLocationId);
  }

  const { count, error } = await query;

  if (error) {
    throw error;
  }

  return count ?? 0;
}

function isSubscriptionExpired(subscription: SubscriptionRow): boolean {
  return Boolean(
    subscription.current_period_end &&
      new Date(subscription.current_period_end).getTime() < Date.now()
  );
}

function isSubscriptionUsable(subscription: SubscriptionRow): boolean {
  return (
    ACTIVE_SUBSCRIPTION_STATUSES.includes(subscription.status) &&
    !isSubscriptionExpired(subscription)
  );
}

function compareSubscriptionsForFeatureAccess(
  left: SubscriptionRow,
  right: SubscriptionRow
): number {
  const leftUsable = isSubscriptionUsable(left);
  const rightUsable = isSubscriptionUsable(right);

  if (leftUsable !== rightUsable) {
    return leftUsable ? -1 : 1;
  }

  const leftPeriodEnd = getSubscriptionPeriodSortTime(left);
  const rightPeriodEnd = getSubscriptionPeriodSortTime(right);

  if (leftPeriodEnd !== rightPeriodEnd) {
    return rightPeriodEnd - leftPeriodEnd;
  }

  return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
}

function getSubscriptionPeriodSortTime(subscription: SubscriptionRow): number {
  if (!subscription.current_period_end) {
    return isSubscriptionUsable(subscription) ? Number.POSITIVE_INFINITY : 0;
  }

  return new Date(subscription.current_period_end).getTime();
}

function estimateAvailabilitySlotCount({
  appointmentDurationMinutes,
  breakMinutes,
  endTime,
  startTime
}: {
  appointmentDurationMinutes: number;
  breakMinutes: number;
  endTime: string;
  startTime: string;
}): number {
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);
  const interval = appointmentDurationMinutes + breakMinutes;

  if (interval <= 0 || endMinutes <= startMinutes) {
    return 0;
  }

  let count = 0;
  let cursor = startMinutes;

  while (cursor + appointmentDurationMinutes <= endMinutes) {
    count += 1;
    cursor += interval;
  }

  return count;
}

function parseTimeToMinutes(value: string): number {
  const [hours = "0", minutes = "0"] = value.split(":");

  return Number(hours) * 60 + Number(minutes);
}

function getMonthRange(value: string): {
  rangeEnd: string;
  rangeStart: string;
} {
  const [year, month] = value.split("-").map(Number);
  const start = new Date(Date.UTC(year, (month ?? 1) - 1, 1));
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));

  return {
    rangeStart: start.toISOString(),
    rangeEnd: end.toISOString()
  };
}
