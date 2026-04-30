import { canAccessClinicDashboard, canAddLocation, getOwnClinicSubscriptionContext, type ClinicSubscriptionContext } from "@/services/subscription.service";
import { getSupabase } from "@/lib/supabase";
import type { Database, Json } from "@/types/supabase";

export type ClinicProfile = {
  createdAt: string;
  description: string | null;
  email: string | null;
  id: string;
  logoUrl: string | null;
  name: string;
  phone: string | null;
  updatedAt: string;
  website: string | null;
};

export type ClinicLocation = {
  address: string;
  city: string;
  createdAt: string;
  id: string;
  latitude: number | null;
  longitude: number | null;
  openingHours: string | null;
  updatedAt: string;
};

export type ClinicDoctor = {
  doctorId: string;
  fullName: string;
  id: string;
  profileImageUrl: string | null;
  registrationNumber: string;
  role: MembershipRole;
  specialties: string[];
  status: MembershipStatus;
  title: string | null;
  verificationStatus: DoctorProfileRow["verification_status"];
  yearsOfExperience: number;
};

export type ClinicAppointment = {
  appointmentDate: string;
  cancellationReason: string | null;
  doctor: Pick<ClinicDoctor, "doctorId" | "fullName" | "specialties" | "title"> | null;
  doctorId: string;
  endTime: string;
  id: string;
  location: {
    address: string | null;
    city: string | null;
    id: string;
    name: string | null;
  } | null;
  locationId: string;
  patientName: string;
  reasonForVisit: string | null;
  startTime: string;
  status: AppointmentStatus;
};

export type ClinicAnalytics = {
  activeDoctors: number;
  bookingsByDoctor: Array<{
    doctorId: string;
    doctorName: string;
    value: number;
  }>;
  cancelledAppointments: number;
  cancelledRate: number;
  completedAppointments: number;
  completionRate: number;
  locationPerformance: Array<{
    locationId: string;
    locationName: string;
    value: number;
  }>;
  locations: number;
  noShowAppointments: number;
  noShowRate: number;
  revenueCurrency: string;
  revenueEstimate: number;
  totalClinicBookings: number;
  totalAppointments: number;
  upcomingAppointments: number;
};

export type ClinicWorkspace = {
  analytics: ClinicAnalytics;
  appointments: ClinicAppointment[];
  canUseFullClinicDashboard: boolean;
  clinic: ClinicProfile | null;
  doctors: ClinicDoctor[];
  locations: ClinicLocation[];
  subscription: ClinicSubscriptionContext;
};

export type ClinicProfileInput = {
  description?: string;
  email: string;
  logoUri?: string | null;
  name: string;
  phone: string;
  website?: string;
};

export type ClinicLocationInput = {
  address: string;
  city: string;
  id?: string;
  latitude?: string;
  longitude?: string;
  openingHours?: string;
};

export type ClinicDoctorInviteInput = {
  email?: string;
  registrationNumber?: string;
};

export type MembershipStatus =
  Database["public"]["Tables"]["doctor_clinic_memberships"]["Row"]["status"];
export type MembershipRole =
  Database["public"]["Tables"]["doctor_clinic_memberships"]["Row"]["role"];
export type AppointmentStatus = Database["public"]["Enums"]["appointment_status"];

type ClinicRow = Database["public"]["Tables"]["clinics"]["Row"];
type ClinicLocationRow = Database["public"]["Tables"]["clinic_locations"]["Row"];
type DoctorMembershipRow =
  Database["public"]["Tables"]["doctor_clinic_memberships"]["Row"];
type DoctorProfileRow = Pick<
  Database["public"]["Tables"]["doctor_profiles"]["Row"],
  | "full_name"
  | "id"
  | "profile_image_url"
  | "registration_number"
  | "specialties"
  | "title"
  | "verification_status"
  | "years_of_experience"
>;
type AppointmentRow = Database["public"]["Tables"]["appointments"]["Row"];
type PaymentRow = Database["public"]["Tables"]["payments"]["Row"];
type ProfileNameRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "full_name" | "id"
>;

const cancelledStatuses: AppointmentStatus[] = [
  "cancelled",
  "cancelled_by_doctor",
  "cancelled_by_patient"
];

export async function getClinicWorkspace(): Promise<ClinicWorkspace> {
  const subscription = await getOwnClinicSubscriptionContext();
  const canUseFullClinicDashboard = canAccessClinicDashboard(subscription);

  if (!subscription.clinicId) {
    return {
      analytics: buildClinicAnalytics([], [], [], []),
      appointments: [],
      canUseFullClinicDashboard,
      clinic: null,
      doctors: [],
      locations: [],
      subscription
    };
  }

  const [clinic, locations, doctors, appointments, payments] = await Promise.all([
    loadClinic(subscription.clinicId),
    listClinicLocations(subscription.clinicId),
    listClinicDoctors(subscription.clinicId),
    canUseFullClinicDashboard
      ? listClinicAppointments(subscription.clinicId)
      : Promise.resolve([]),
    canUseFullClinicDashboard
      ? listClinicAppointmentPayments(subscription.clinicId)
      : Promise.resolve([])
  ]);

  return {
    analytics: buildClinicAnalytics(appointments, doctors, locations, payments),
    appointments,
    canUseFullClinicDashboard,
    clinic,
    doctors,
    locations,
    subscription
  };
}

export async function saveClinicProfile(
  values: ClinicProfileInput
): Promise<string> {
  const subscription = await getOwnClinicSubscriptionContext();
  const supabase = getSupabase();
  let clinicId = subscription.clinicId;
  let logoUrl: string | null = null;

  if (!clinicId) {
    const { data, error } = await supabase.rpc(
      "create_clinic_profile_for_current_admin",
      {
        clinic_description: values.description?.trim() || null,
        clinic_email: values.email.trim(),
        clinic_name: values.name.trim(),
        clinic_phone: values.phone.trim(),
        clinic_website: values.website?.trim() || null
      }
    );

    if (error) {
      throw error;
    }

    clinicId = data;
  }

  if (values.logoUri) {
    logoUrl = await uploadClinicLogo(clinicId, values.logoUri);
  }

  const { error } = await supabase
    .from("clinics")
    .update({
      description: values.description?.trim() || null,
      email: values.email.trim(),
      logo_url: logoUrl ?? undefined,
      name: values.name.trim(),
      phone: values.phone.trim(),
      website: values.website?.trim() || null
    })
    .eq("id", clinicId);

  if (error) {
    throw error;
  }

  return clinicId;
}

export async function upsertClinicLocation(
  values: ClinicLocationInput
): Promise<void> {
  const subscription = await getOwnClinicSubscriptionContext();

  if (!subscription.clinicId) {
    throw new Error("Create a clinic profile before adding locations.");
  }

  const currentLocationCount = await countClinicLocations({
    clinicId: subscription.clinicId,
    excludedLocationId: values.id
  });

  if (!canAddLocation(subscription, currentLocationCount, 1)) {
    throw new Error(
      `${subscription.plan.name} allows ${subscription.plan.limits.max_locations} clinic location(s). Upgrade before adding more locations.`
    );
  }

  const supabase = getSupabase();
  const payload = {
    address: values.address.trim(),
    city: values.city.trim(),
    clinic_id: subscription.clinicId,
    latitude: values.latitude ? Number(values.latitude) : null,
    longitude: values.longitude ? Number(values.longitude) : null,
    opening_hours: parseOpeningHours(values.openingHours)
  };
  const query = values.id
    ? supabase.from("clinic_locations").update(payload).eq("id", values.id)
    : supabase.from("clinic_locations").insert(payload);
  const { error } = await query;

  if (error) {
    throw error;
  }
}

export async function inviteDoctorToClinic(
  values: ClinicDoctorInviteInput
): Promise<string> {
  const workspace = await getClinicWorkspace();

  if (!workspace.clinic) {
    throw new Error("Create a clinic profile before inviting doctors.");
  }

  const managedDoctorCount = workspace.doctors.filter((doctor) =>
    ["active", "pending"].includes(doctor.status)
  ).length;

  if (managedDoctorCount >= 1 && !workspace.canUseFullClinicDashboard) {
    throw new Error("Clinic Plan is required before adding multiple doctors.");
  }

  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("clinic_invite_doctor", {
    doctor_email: values.email?.trim() || null,
    doctor_registration_number: values.registrationNumber?.trim() || null,
    target_clinic_id: workspace.clinic.id,
    target_role: "doctor"
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function updateClinicDoctorMembershipStatus({
  membershipId,
  status
}: {
  membershipId: string;
  status: MembershipStatus;
}): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("doctor_clinic_memberships")
    .update({ status })
    .eq("id", membershipId);

  if (error) {
    throw error;
  }
}

export function formatClinicAppointmentStatus(status: AppointmentStatus): string {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function isCancelledClinicAppointment(
  appointment: Pick<ClinicAppointment, "status">
): boolean {
  return cancelledStatuses.includes(appointment.status);
}

export function formatClinicDateTime(
  appointment: Pick<ClinicAppointment, "appointmentDate" | "startTime">
): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(`${appointment.appointmentDate}T${appointment.startTime}`));
}

export function trimClinicTime(value: string): string {
  return value.slice(0, 5);
}

async function loadClinic(clinicId: string): Promise<ClinicProfile | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("clinics")
    .select("*")
    .eq("id", clinicId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapClinic(data) : null;
}

async function listClinicLocations(clinicId: string): Promise<ClinicLocation[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("clinic_locations")
    .select("*")
    .eq("clinic_id", clinicId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapClinicLocation);
}

async function listClinicDoctors(clinicId: string): Promise<ClinicDoctor[]> {
  const supabase = getSupabase();
  const { data: memberships, error } = await supabase
    .from("doctor_clinic_memberships")
    .select("*")
    .eq("clinic_id", clinicId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const doctorIds = Array.from(new Set((memberships ?? []).map((item) => item.doctor_id)));

  if (doctorIds.length === 0) {
    return [];
  }

  const { data: doctors, error: doctorsError } = await supabase
    .from("doctor_profiles")
    .select(
      "id, title, full_name, profile_image_url, registration_number, specialties, years_of_experience, verification_status"
    )
    .in("id", doctorIds);

  if (doctorsError) {
    throw doctorsError;
  }

  return (memberships ?? []).map((membership) => {
    const doctor = (doctors ?? []).find((item) => item.id === membership.doctor_id);

    return mapClinicDoctor(membership, doctor ?? null);
  });
}

async function listClinicAppointments(
  clinicId: string
): Promise<ClinicAppointment[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("clinic_id", clinicId)
    .order("appointment_date", { ascending: false })
    .order("start_time", { ascending: false })
    .limit(500);

  if (error) {
    throw error;
  }

  return hydrateClinicAppointments(data ?? []);
}

async function listClinicAppointmentPayments(clinicId: string): Promise<PaymentRow[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("clinic_id", clinicId)
    .in("payment_type", ["appointment", "deposit", "cancellation_fee"])
    .eq("status", "paid")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function hydrateClinicAppointments(
  rows: AppointmentRow[]
): Promise<ClinicAppointment[]> {
  if (rows.length === 0) {
    return [];
  }

  const supabase = getSupabase();
  const doctorIds = Array.from(new Set(rows.map((item) => item.doctor_id)));
  const patientIds = Array.from(new Set(rows.map((item) => item.patient_id)));
  const locationIds = Array.from(new Set(rows.map((item) => item.location_id)));
  const [doctorsResult, patientsResult, locationsResult] = await Promise.all([
    supabase
      .from("doctor_profiles")
      .select("id, title, full_name, specialties")
      .in("id", doctorIds),
    supabase
      .from("patient_profiles")
      .select("id, user_id")
      .in("id", patientIds),
    supabase
      .from("doctor_locations")
      .select("id, custom_location_name, address, city")
      .in("id", locationIds)
  ]);

  if (doctorsResult.error) {
    throw doctorsResult.error;
  }

  if (patientsResult.error) {
    throw patientsResult.error;
  }

  if (locationsResult.error) {
    throw locationsResult.error;
  }

  const names = await loadProfileNames(
    Array.from(new Set((patientsResult.data ?? []).map((item) => item.user_id)))
  );

  return rows.map((appointment) => {
    const doctor = (doctorsResult.data ?? []).find(
      (item) => item.id === appointment.doctor_id
    );
    const patient = (patientsResult.data ?? []).find(
      (item) => item.id === appointment.patient_id
    );
    const patientName = names.find((item) => item.id === patient?.user_id);
    const location = (locationsResult.data ?? []).find(
      (item) => item.id === appointment.location_id
    );

    return {
      appointmentDate: appointment.appointment_date,
      cancellationReason: appointment.cancellation_reason,
      doctor: doctor
        ? {
            doctorId: doctor.id,
            fullName: doctor.full_name,
            specialties: doctor.specialties,
            title: doctor.title
          }
        : null,
      doctorId: appointment.doctor_id,
      endTime: appointment.end_time,
      id: appointment.id,
      location: location
        ? {
            address: location.address,
            city: location.city,
            id: location.id,
            name: location.custom_location_name
          }
        : null,
      locationId: appointment.location_id,
      patientName: patientName?.full_name ?? "Patient",
      reasonForVisit: appointment.reason_for_visit,
      startTime: appointment.start_time,
      status: appointment.status
    };
  });
}

async function loadProfileNames(userIds: string[]): Promise<ProfileNameRow[]> {
  if (userIds.length === 0) {
    return [];
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", userIds);

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function countClinicLocations({
  clinicId,
  excludedLocationId
}: {
  clinicId: string;
  excludedLocationId?: string;
}): Promise<number> {
  const supabase = getSupabase();
  let query = supabase
    .from("clinic_locations")
    .select("id", { count: "exact", head: true })
    .eq("clinic_id", clinicId);

  if (excludedLocationId) {
    query = query.neq("id", excludedLocationId);
  }

  const { count, error } = await query;

  if (error) {
    throw error;
  }

  return count ?? 0;
}

async function uploadClinicLogo(clinicId: string, uri: string): Promise<string> {
  if (uri.startsWith("http://") || uri.startsWith("https://")) {
    return uri;
  }

  const supabase = getSupabase();
  const extension = uri.split(".").pop()?.toLowerCase() || "jpg";
  const normalizedExtension = extension === "jpg" ? "jpeg" : extension;
  const path = `${clinicId}/clinic-logo-${Date.now()}.${extension}`;
  const response = await fetch(uri);
  const arrayBuffer = await response.arrayBuffer();
  const { error } = await supabase.storage
    .from("clinic-logos")
    .upload(path, arrayBuffer, {
      contentType: `image/${normalizedExtension}`,
      upsert: true
    });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from("clinic-logos").getPublicUrl(path);

  return data.publicUrl;
}

function parseOpeningHours(value?: string): Json {
  const trimmed = value?.trim();

  if (!trimmed) {
    return {};
  }

  try {
    const parsed = JSON.parse(trimmed);

    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Json;
    }
  } catch {
    return { note: trimmed };
  }

  return { note: trimmed };
}

function mapClinic(row: ClinicRow): ClinicProfile {
  return {
    createdAt: row.created_at,
    description: row.description,
    email: row.email,
    id: row.id,
    logoUrl: row.logo_url,
    name: row.name,
    phone: row.phone,
    updatedAt: row.updated_at,
    website: row.website
  };
}

function mapClinicLocation(row: ClinicLocationRow): ClinicLocation {
  return {
    address: row.address,
    city: row.city,
    createdAt: row.created_at,
    id: row.id,
    latitude: row.latitude,
    longitude: row.longitude,
    openingHours: formatOpeningHours(row.opening_hours),
    updatedAt: row.updated_at
  };
}

function mapClinicDoctor(
  membership: DoctorMembershipRow,
  doctor: DoctorProfileRow | null
): ClinicDoctor {
  return {
    doctorId: membership.doctor_id,
    fullName: doctor?.full_name ?? "Doctor profile unavailable",
    id: membership.id,
    profileImageUrl: doctor?.profile_image_url ?? null,
    registrationNumber: doctor?.registration_number ?? "Unavailable",
    role: membership.role,
    specialties: doctor?.specialties ?? [],
    status: membership.status,
    title: doctor?.title ?? null,
    verificationStatus: doctor?.verification_status ?? "pending",
    yearsOfExperience: doctor?.years_of_experience ?? 0
  };
}

function formatOpeningHours(value: Json): string | null {
  if (!value || (typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0)) {
    return null;
  }

  if (
    typeof value === "object" &&
    !Array.isArray(value) &&
    typeof value.note === "string"
  ) {
    return value.note;
  }

  return JSON.stringify(value);
}

function buildClinicAnalytics(
  appointments: ClinicAppointment[],
  doctors: ClinicDoctor[],
  locations: ClinicLocation[],
  payments: PaymentRow[]
): ClinicAnalytics {
  const total = appointments.length;
  const completed = appointments.filter(
    (appointment) => appointment.status === "completed"
  ).length;
  const cancelled = appointments.filter(isCancelledClinicAppointment).length;
  const noShow = appointments.filter(
    (appointment) => appointment.status === "no_show"
  ).length;
  const now = Date.now();
  const upcoming = appointments.filter((appointment) =>
    ["requested", "pending", "confirmed"].includes(appointment.status)
      && new Date(`${appointment.appointmentDate}T${appointment.startTime}`).getTime() >= now
  ).length;
  const revenueCurrency = payments[0]?.currency?.toUpperCase() ?? "USD";
  const revenueEstimate = payments
    .filter((payment) => payment.currency.toUpperCase() === revenueCurrency)
    .reduce((sum, payment) => sum + Number(payment.amount), 0);

  return {
    activeDoctors: doctors.filter((doctor) => doctor.status === "active").length,
    bookingsByDoctor: getBookingsByDoctor(appointments),
    cancelledAppointments: cancelled,
    cancelledRate: toPercent(cancelled, total),
    completedAppointments: completed,
    completionRate: toPercent(completed, total),
    locationPerformance: getLocationPerformance(appointments),
    locations: locations.length,
    noShowAppointments: noShow,
    noShowRate: toPercent(noShow, total),
    revenueCurrency,
    revenueEstimate,
    totalClinicBookings: total,
    totalAppointments: total,
    upcomingAppointments: upcoming
  };
}

function getBookingsByDoctor(
  appointments: ClinicAppointment[]
): ClinicAnalytics["bookingsByDoctor"] {
  const counts = new Map<
    string,
    ClinicAnalytics["bookingsByDoctor"][number]
  >();

  appointments.forEach((appointment) => {
    const current = counts.get(appointment.doctorId);

    counts.set(appointment.doctorId, {
      doctorId: appointment.doctorId,
      doctorName: appointment.doctor?.fullName ?? "Doctor unavailable",
      value: (current?.value ?? 0) + 1
    });
  });

  return [...counts.values()]
    .sort((left, right) => right.value - left.value)
    .slice(0, 5);
}

function getLocationPerformance(
  appointments: ClinicAppointment[]
): ClinicAnalytics["locationPerformance"] {
  const counts = new Map<
    string,
    ClinicAnalytics["locationPerformance"][number]
  >();

  appointments.forEach((appointment) => {
    const current = counts.get(appointment.locationId);
    const locationName =
      appointment.location?.name ??
      appointment.location?.city ??
      appointment.location?.address ??
      "Location unavailable";

    counts.set(appointment.locationId, {
      locationId: appointment.locationId,
      locationName,
      value: (current?.value ?? 0) + 1
    });
  });

  return [...counts.values()]
    .sort((left, right) => right.value - left.value)
    .slice(0, 5);
}

function toPercent(value: number, total: number): number {
  if (total === 0) {
    return 0;
  }

  return Math.round((value / total) * 100);
}
