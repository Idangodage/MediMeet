import { getSupabase } from "@/lib/supabase";
import type { ProfileRow } from "@/types/profile";
import type { AuthenticatedRole } from "@/types/roles";
import type { Database, Json } from "@/types/supabase";

export type AdminRoleFilter = AuthenticatedRole | "all";
export type ReportStatus = Database["public"]["Enums"]["report_status"];
export type AdminVerificationStatus =
  Database["public"]["Enums"]["verification_status"];
type UserReportRow = Database["public"]["Tables"]["user_reports"]["Row"];
type AuditLogRow = Database["public"]["Tables"]["audit_logs"]["Row"];

export type AdminCurrencyAmount = {
  amount: number;
  currency: string;
};

export type AdminDoctorProfileSummary = {
  id: string;
  userId: string;
  fullName: string;
  specialties: string[];
  verificationStatus: AdminVerificationStatus;
  isPublic: boolean;
  updatedAt: string;
};

export type AdminUser = {
  id: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  role: AuthenticatedRole;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
  doctorProfile: AdminDoctorProfileSummary | null;
  clinicMembershipCount: number;
  patientCity: string | null;
};

export type AdminDashboardOverview = {
  activeSubscriptions: number;
  failedPaymentCount: number;
  monthlyRecurringRevenue: AdminCurrencyAmount[];
  openReportCount: number;
  pastDueSubscriptionCount: number;
  pendingVerificationCount: number;
  recentAuditLogs: AdminAuditLog[];
  totalAppointments: number;
  totalDoctors: number;
  totalUsers: number;
  trialUsers: number;
  usersByRole: Record<AuthenticatedRole, number>;
  verifiedDoctors: number;
};

export type AdminReport = {
  id: string;
  reporter: Pick<AdminUser, "email" | "fullName" | "id" | "role"> | null;
  reported: Pick<AdminUser, "email" | "fullName" | "id" | "role"> | null;
  reportedDoctorProfile: AdminDoctorProfileSummary | null;
  appointmentId: string | null;
  reason: string;
  status: ReportStatus;
  adminNote: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminAuditLog = {
  id: string;
  actor: Pick<AdminUser, "email" | "fullName" | "id" | "role"> | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  metadata: Json;
  createdAt: string;
};

export async function getAdminDashboardOverview(): Promise<AdminDashboardOverview> {
  const supabase = getSupabase();
  const [
    profilesResult,
    doctorProfilesResult,
    subscriptionsResult,
    appointmentsResult,
    monthlyRevenueResult,
    verificationsResult,
    reportsResult,
    failedPaymentsResult,
    pastDueSubscriptionsResult,
    recentAuditLogs
  ] = await Promise.all([
    supabase.from("profiles").select("role").limit(5000),
    supabase
      .from("doctor_profiles")
      .select("id, verification_status")
      .limit(5000),
    supabase.from("subscriptions").select("id, status").limit(5000),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("invoices")
      .select("amount, currency")
      .eq("status", "paid")
      .gte("created_at", getCurrentMonthStartIso())
      .limit(5000),
    supabase
      .from("doctor_profiles")
      .select("id", { count: "exact", head: true })
      .in("verification_status", ["pending", "needs_review"]),
    supabase
      .from("user_reports")
      .select("id", { count: "exact", head: true })
      .in("status", ["open", "under_review"]),
    supabase
      .from("payments")
      .select("id", { count: "exact", head: true })
      .eq("status", "failed"),
    supabase
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("status", "past_due"),
    listAuditLogs(5)
  ]);

  if (profilesResult.error) {
    throw profilesResult.error;
  }

  if (doctorProfilesResult.error) {
    throw doctorProfilesResult.error;
  }

  if (subscriptionsResult.error) {
    throw subscriptionsResult.error;
  }

  if (appointmentsResult.error) {
    throw appointmentsResult.error;
  }

  if (monthlyRevenueResult.error) {
    throw monthlyRevenueResult.error;
  }

  if (verificationsResult.error) {
    throw verificationsResult.error;
  }

  if (reportsResult.error) {
    throw reportsResult.error;
  }

  if (failedPaymentsResult.error) {
    throw failedPaymentsResult.error;
  }

  if (pastDueSubscriptionsResult.error) {
    throw pastDueSubscriptionsResult.error;
  }

  const usersByRole: Record<AuthenticatedRole, number> = {
    patient: 0,
    doctor: 0,
    clinic_admin: 0,
    platform_admin: 0
  };

  for (const profile of profilesResult.data ?? []) {
    usersByRole[profile.role] += 1;
  }

  return {
    activeSubscriptions: (subscriptionsResult.data ?? []).filter(
      (subscription) => subscription.status === "active"
    ).length,
    failedPaymentCount: failedPaymentsResult.count ?? 0,
    monthlyRecurringRevenue: summarizeCurrencyAmounts(
      monthlyRevenueResult.data ?? []
    ),
    openReportCount: reportsResult.count ?? 0,
    pastDueSubscriptionCount: pastDueSubscriptionsResult.count ?? 0,
    pendingVerificationCount: verificationsResult.count ?? 0,
    recentAuditLogs,
    totalAppointments: appointmentsResult.count ?? 0,
    totalDoctors: doctorProfilesResult.data?.length ?? 0,
    totalUsers: profilesResult.data?.length ?? 0,
    trialUsers: (subscriptionsResult.data ?? []).filter(
      (subscription) => subscription.status === "trialing"
    ).length,
    usersByRole,
    verifiedDoctors: (doctorProfilesResult.data ?? []).filter(
      (doctor) => doctor.verification_status === "approved"
    ).length
  };
}

export async function listAdminUsers(
  roleFilter: AdminRoleFilter = "all"
): Promise<AdminUser[]> {
  const supabase = getSupabase();
  let query = supabase
    .from("profiles")
    .select("id, role, full_name, email, phone, avatar_url, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (roleFilter !== "all") {
    query = query.eq("role", roleFilter);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return hydrateAdminUsers((data ?? []) as ProfileRow[]);
}

export async function moderateDoctorProfile({
  doctorId,
  isPublic,
  note,
  verificationStatus
}: {
  doctorId: string;
  isPublic?: boolean | null;
  note?: string | null;
  verificationStatus?: AdminVerificationStatus | null;
}): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.rpc("admin_moderate_doctor_profile", {
    target_doctor_id: doctorId,
    target_is_public: isPublic ?? null,
    target_verification_status: verificationStatus ?? null,
    moderation_note: note ?? null
  });

  if (error) {
    throw error;
  }
}

export async function listAdminReports(
  statusFilter: ReportStatus | "all" = "all"
): Promise<AdminReport[]> {
  const supabase = getSupabase();
  let query = supabase
    .from("user_reports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return hydrateReports(data ?? []);
}

export async function reviewUserReport({
  note,
  reportId,
  status
}: {
  note?: string;
  reportId: string;
  status: ReportStatus;
}): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.rpc("admin_review_user_report", {
    target_report_id: reportId,
    target_status: status,
    review_note: note ?? null
  });

  if (error) {
    throw error;
  }
}

export async function listAuditLogs(limit = 100): Promise<AdminAuditLog[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return hydrateAuditLogs(data ?? []);
}

export function formatAdminRole(role: AuthenticatedRole): string {
  if (role === "clinic_admin") {
    return "Clinic admin";
  }

  if (role === "platform_admin") {
    return "Platform admin";
  }

  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function formatReportStatus(status: ReportStatus): string {
  if (status === "under_review") {
    return "Under review";
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function formatAuditAction(action: string): string {
  return action
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function hydrateAdminUsers(rows: ProfileRow[]): Promise<AdminUser[]> {
  if (rows.length === 0) {
    return [];
  }

  const supabase = getSupabase();
  const userIds = rows.map((row) => row.id);
  const [doctorProfilesResult, patientProfilesResult, clinicMembershipsResult] =
    await Promise.all([
      supabase
        .from("doctor_profiles")
        .select(
          "id, user_id, full_name, specialties, verification_status, is_public, updated_at"
        )
        .in("user_id", userIds),
      supabase
        .from("patient_profiles")
        .select("user_id, city")
        .in("user_id", userIds),
      supabase
        .from("clinic_admin_memberships")
        .select("user_id, id")
        .in("user_id", userIds)
    ]);

  if (doctorProfilesResult.error) {
    throw doctorProfilesResult.error;
  }

  if (patientProfilesResult.error) {
    throw patientProfilesResult.error;
  }

  if (clinicMembershipsResult.error) {
    throw clinicMembershipsResult.error;
  }

  const doctorByUserId = new Map(
    (doctorProfilesResult.data ?? []).map((doctor) => [
      doctor.user_id,
      mapDoctorProfileSummary(doctor)
    ])
  );
  const patientCityByUserId = new Map(
    (patientProfilesResult.data ?? []).map((patient) => [
      patient.user_id,
      patient.city
    ])
  );
  const clinicCountByUserId = new Map<string, number>();

  for (const membership of clinicMembershipsResult.data ?? []) {
    clinicCountByUserId.set(
      membership.user_id,
      (clinicCountByUserId.get(membership.user_id) ?? 0) + 1
    );
  }

  return rows.map((row) => ({
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    doctorProfile: doctorByUserId.get(row.id) ?? null,
    clinicMembershipCount: clinicCountByUserId.get(row.id) ?? 0,
    patientCity: patientCityByUserId.get(row.id) ?? null
  }));
}

async function hydrateReports(rows: UserReportRow[]): Promise<AdminReport[]> {
  if (rows.length === 0) {
    return [];
  }

  const profileIds = [
    ...new Set(
      rows.flatMap((row) => [row.reporter_user_id, row.reported_user_id])
    )
  ];
  const users = await hydrateAdminUsers(await loadProfiles(profileIds));
  const usersById = new Map(users.map((user) => [user.id, user]));

  return rows.map((row) => {
    const reporter = usersById.get(row.reporter_user_id) ?? null;
    const reported = usersById.get(row.reported_user_id) ?? null;

    return {
      id: row.id,
      reporter: reporter ? pickUserIdentity(reporter) : null,
      reported: reported ? pickUserIdentity(reported) : null,
      reportedDoctorProfile: reported?.doctorProfile ?? null,
      appointmentId: row.appointment_id,
      reason: row.reason,
      status: row.status,
      adminNote: row.admin_note,
      reviewedBy: row.reviewed_by,
      reviewedAt: row.reviewed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  });
}

async function hydrateAuditLogs(rows: AuditLogRow[]): Promise<AdminAuditLog[]> {
  if (rows.length === 0) {
    return [];
  }

  const actorIds = [
    ...new Set(
      rows
        .map((row) => row.actor_user_id)
        .filter((id): id is string => Boolean(id))
    )
  ];
  const users = actorIds.length > 0
    ? await hydrateAdminUsers(await loadProfiles(actorIds))
    : [];
  const usersById = new Map(users.map((user) => [user.id, user]));

  return rows.map((row) => {
    const actor = row.actor_user_id
      ? usersById.get(row.actor_user_id) ?? null
      : null;

    return {
      id: row.id,
      actor: actor ? pickUserIdentity(actor) : null,
      action: row.action,
      resourceType: row.resource_type,
      resourceId: row.resource_id,
      metadata: row.metadata,
      createdAt: row.created_at
    };
  });
}

async function loadProfiles(userIds: string[]): Promise<ProfileRow[]> {
  if (userIds.length === 0) {
    return [];
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, full_name, email, phone, avatar_url, created_at, updated_at")
    .in("id", userIds);

  if (error) {
    throw error;
  }

  return (data ?? []) as ProfileRow[];
}

function mapDoctorProfileSummary(row: {
  id: string;
  user_id: string;
  full_name: string;
  specialties: string[];
  verification_status: AdminVerificationStatus;
  is_public: boolean;
  updated_at: string;
}): AdminDoctorProfileSummary {
  return {
    id: row.id,
    userId: row.user_id,
    fullName: row.full_name,
    specialties: row.specialties,
    verificationStatus: row.verification_status,
    isPublic: row.is_public,
    updatedAt: row.updated_at
  };
}

function pickUserIdentity(user: AdminUser) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role
  };
}

function summarizeCurrencyAmounts(
  rows: Array<{ amount: number; currency: string }>
): AdminCurrencyAmount[] {
  const totals = new Map<string, number>();

  rows.forEach((row) => {
    const currency = row.currency.toUpperCase();
    totals.set(currency, (totals.get(currency) ?? 0) + Number(row.amount));
  });

  return [...totals.entries()]
    .map(([currency, amount]) => ({ amount, currency }))
    .sort((left, right) => left.currency.localeCompare(right.currency));
}

function getCurrentMonthStartIso(): string {
  const now = new Date();

  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  ).toISOString();
}
