import { getSupabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

export type DoctorAppointmentStatus =
  Database["public"]["Enums"]["appointment_status"];
export type ConsultationType =
  Database["public"]["Enums"]["consultation_type"];

export type DoctorAppointmentPatient = {
  id: string;
  userId: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  preferredLanguage: string;
};

export type DoctorAppointmentLocation = {
  id: string;
  name: string | null;
  address: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type DoctorAppointment = {
  id: string;
  patientId: string;
  doctorId: string;
  clinicId: string | null;
  locationId: string;
  slotId: string | null;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  reasonForVisit: string | null;
  status: DoctorAppointmentStatus;
  cancellationReason: string | null;
  cancelledBy: string | null;
  rescheduledFrom: string | null;
  createdAt: string;
  updatedAt: string;
  patient: DoctorAppointmentPatient | null;
  location: DoctorAppointmentLocation | null;
  canShowPatientContact: boolean;
};

export type DoctorTreatedPatient = {
  id: string;
  patientId: string;
  fullName: string;
  city: string | null;
  preferredLanguage: string;
  firstVisitDate: string | null;
  lastVisitDate: string | null;
  totalVisits: number;
  relationshipStatus: "active" | "inactive" | "archived";
};

export type DoctorAnalyticsBreakdown = {
  label: string;
  value: number;
};

export type DoctorLocationAnalytics = DoctorAnalyticsBreakdown & {
  locationId: string;
};

export type DoctorDashboardAnalytics = {
  profileViews: number;
  totalBookings: number;
  completedAppointments: number;
  cancelledAppointments: number;
  totalAppointments: number;
  activeAppointments: number;
  uniquePatients: number;
  treatedPatients: number;
  newPatients: number;
  returningPatients: number;
  completionRate: number;
  cancellationRate: number;
  noShowRate: number;
  mostBookedDays: DoctorAnalyticsBreakdown[];
  mostActiveLocation: DoctorLocationAnalytics | null;
};

export type DoctorAppointmentDashboardData = {
  today: DoctorAppointment[];
  upcoming: DoctorAppointment[];
  requested: DoctorAppointment[];
  completed: DoctorAppointment[];
  cancelled: DoctorAppointment[];
  noShow: DoctorAppointment[];
  treatedPatients: DoctorTreatedPatient[];
  analytics: DoctorDashboardAnalytics;
};

export type DoctorRescheduleSlot = {
  id: string;
  availabilityId: string;
  locationId: string;
  location: DoctorAppointmentLocation | null;
  consultationType: ConsultationType;
  startTime: string;
  endTime: string;
};

type AppointmentRow = Database["public"]["Tables"]["appointments"]["Row"];
type PatientProfileRow = Pick<
  Database["public"]["Tables"]["patient_profiles"]["Row"],
  "id" | "user_id" | "city" | "preferred_language"
>;
type ProfileNameRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "full_name"
>;
type ProfileContactRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "email" | "phone"
>;
type LocationRow = Pick<
  Database["public"]["Tables"]["doctor_locations"]["Row"],
  | "id"
  | "custom_location_name"
  | "address"
  | "city"
  | "latitude"
  | "longitude"
>;
type RelationshipRow =
  Database["public"]["Tables"]["doctor_patient_relationships"]["Row"];

const activeStatuses: DoctorAppointmentStatus[] = [
  "requested",
  "pending",
  "confirmed"
];
const cancelledStatuses: DoctorAppointmentStatus[] = [
  "cancelled",
  "cancelled_by_patient",
  "cancelled_by_doctor"
];
const contactVisibleStatuses: DoctorAppointmentStatus[] = [
  "confirmed",
  "completed",
  "no_show"
];

export async function getDoctorAppointmentDashboardData(): Promise<
  DoctorAppointmentDashboardData
> {
  const [appointments, treatedPatients, profileViews] = await Promise.all([
    listOwnDoctorAppointments(),
    listDoctorTreatedPatients(),
    countOwnDoctorProfileViews()
  ]);
  const todayIso = getTodayIsoDate();
  const now = Date.now();
  const today = appointments.filter(
    (appointment) =>
      appointment.appointmentDate === todayIso &&
      appointment.status !== "rescheduled"
  );
  const requested = appointments.filter((appointment) =>
    ["requested", "pending"].includes(appointment.status)
  );
  const completed = appointments.filter(
    (appointment) => appointment.status === "completed"
  );
  const cancelled = appointments.filter(isCancelledDoctorAppointment);
  const noShow = appointments.filter(
    (appointment) => appointment.status === "no_show"
  );
  const upcoming = appointments.filter(
    (appointment) =>
      activeStatuses.includes(appointment.status) &&
      getDoctorAppointmentStart(appointment).getTime() >= now
  );

  return {
    today: sortAscending(today),
    upcoming: sortAscending(upcoming),
    requested: sortAscending(requested),
    completed: sortDescending(completed),
    cancelled: sortDescending(cancelled),
    noShow: sortDescending(noShow),
    treatedPatients,
    analytics: buildAnalytics(appointments, treatedPatients.length, profileViews)
  };
}

export async function listOwnDoctorAppointments(): Promise<
  DoctorAppointment[]
> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .order("appointment_date", { ascending: false })
    .order("start_time", { ascending: false });

  if (error) {
    throw error;
  }

  return hydrateAppointments(data ?? []);
}

export async function getOwnDoctorAppointment(
  appointmentId: string
): Promise<DoctorAppointment | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("id", appointmentId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const [appointment] = await hydrateAppointments([data]);

  return appointment ?? null;
}

export async function listDoctorAppointmentHistory(
  patientId: string
): Promise<DoctorAppointment[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("patient_id", patientId)
    .order("appointment_date", { ascending: false })
    .order("start_time", { ascending: false });

  if (error) {
    throw error;
  }

  return hydrateAppointments(data ?? []);
}

export async function listDoctorTreatedPatients(): Promise<
  DoctorTreatedPatient[]
> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("doctor_patient_relationships")
    .select("*")
    .order("last_visit_date", { ascending: false, nullsFirst: false });

  if (error) {
    throw error;
  }

  return hydrateTreatedPatients(data ?? []);
}

export async function listDoctorRescheduleSlots(
  appointmentId: string
): Promise<DoctorRescheduleSlot[]> {
  const appointment = await getOwnDoctorAppointment(appointmentId);

  if (!appointment || !canRescheduleDoctorAppointment(appointment)) {
    return [];
  }

  const supabase = getSupabase();
  const { data: slots, error } = await supabase
    .from("appointment_slots")
    .select("id, availability_id, start_time, end_time")
    .eq("doctor_id", appointment.doctorId)
    .eq("status", "available")
    .gt("start_time", new Date().toISOString())
    .order("start_time", { ascending: true })
    .limit(20);

  if (error) {
    throw error;
  }

  const availabilityIds = Array.from(
    new Set((slots ?? []).map((slot) => slot.availability_id))
  );
  const availability = await loadAvailabilityForSlots(availabilityIds);
  const locationIds = Array.from(
    new Set(availability.map((item) => item.location_id))
  );
  const locations = await loadLocations(locationIds);

  return (slots ?? [])
    .map((slot) => {
      const availabilityRow = availability.find(
        (item) => item.id === slot.availability_id
      );

      if (!availabilityRow) {
        return null;
      }

      const location =
        locations.find((item) => item.id === availabilityRow.location_id) ??
        null;

      return {
        id: slot.id,
        availabilityId: slot.availability_id,
        locationId: availabilityRow.location_id,
        location: location ? mapLocation(location) : null,
        consultationType: availabilityRow.consultation_type,
        startTime: slot.start_time,
        endTime: slot.end_time
      };
    })
    .filter((slot): slot is DoctorRescheduleSlot => Boolean(slot));
}

export async function confirmDoctorAppointment(
  appointmentId: string
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.rpc("doctor_confirm_appointment", {
    target_appointment_id: appointmentId
  });

  if (error) {
    throw error;
  }
}

export async function cancelDoctorAppointment({
  appointmentId,
  reason
}: {
  appointmentId: string;
  reason?: string;
}): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.rpc("doctor_cancel_appointment", {
    target_appointment_id: appointmentId,
    cancellation_reason: reason?.trim() || null
  });

  if (error) {
    throw error;
  }
}

export async function completeDoctorAppointment(
  appointmentId: string
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.rpc("doctor_mark_appointment_completed", {
    target_appointment_id: appointmentId
  });

  if (error) {
    throw error;
  }
}

export async function markDoctorAppointmentNoShow(
  appointmentId: string
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.rpc("doctor_mark_patient_no_show", {
    target_appointment_id: appointmentId
  });

  if (error) {
    throw error;
  }
}

export async function rescheduleDoctorAppointment({
  appointmentId,
  slotId
}: {
  appointmentId: string;
  slotId: string;
}): Promise<string> {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("doctor_reschedule_appointment", {
    target_appointment_id: appointmentId,
    target_slot_id: slotId
  });

  if (error) {
    throw error;
  }

  return data;
}

export function canConfirmDoctorAppointment(
  appointment: DoctorAppointment
): boolean {
  return (
    ["requested", "pending"].includes(appointment.status) &&
    getDoctorAppointmentStart(appointment).getTime() > Date.now()
  );
}

export function canCancelDoctorAppointment(
  appointment: DoctorAppointment
): boolean {
  return (
    activeStatuses.includes(appointment.status) &&
    getDoctorAppointmentStart(appointment).getTime() > Date.now()
  );
}

export function canRescheduleDoctorAppointment(
  appointment: DoctorAppointment
): boolean {
  return canCancelDoctorAppointment(appointment);
}

export function canCompleteDoctorAppointment(
  appointment: DoctorAppointment
): boolean {
  return (
    activeStatuses.includes(appointment.status) &&
    getDoctorAppointmentStart(appointment).getTime() <= Date.now()
  );
}

export function canMarkDoctorNoShow(appointment: DoctorAppointment): boolean {
  return canCompleteDoctorAppointment(appointment);
}

export function isCancelledDoctorAppointment(
  appointment: Pick<DoctorAppointment, "status">
): boolean {
  return cancelledStatuses.includes(appointment.status);
}

export function getDoctorAppointmentStart(
  appointment: Pick<DoctorAppointment, "appointmentDate" | "startTime">
): Date {
  return new Date(`${appointment.appointmentDate}T${appointment.startTime}`);
}

export function formatDoctorAppointmentStatus(
  status: DoctorAppointmentStatus
): string {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function trimAppointmentTime(value: string): string {
  return value.slice(0, 5);
}

export function formatDoctorAppointmentDateTime(
  appointment: Pick<DoctorAppointment, "appointmentDate" | "startTime">
): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(getDoctorAppointmentStart(appointment));
}

export function formatDoctorLocation(
  location: DoctorAppointmentLocation | null
): string {
  if (!location) {
    return "Location unavailable";
  }

  const label = location.name ?? location.city ?? "Practice location";
  const details = [location.address, location.city].filter(Boolean).join(", ");

  return details ? `${label} - ${details}` : label;
}

async function hydrateAppointments(
  rows: AppointmentRow[]
): Promise<DoctorAppointment[]> {
  const patientIds = Array.from(new Set(rows.map((item) => item.patient_id)));
  const locationIds = Array.from(new Set(rows.map((item) => item.location_id)));
  const [patients, locations] = await Promise.all([
    loadPatientsForAppointments(rows),
    loadLocations(locationIds)
  ]);

  return rows.map((appointment) => {
    const patient = patients.get(appointment.id) ?? null;
    const location =
      locations.find((item) => item.id === appointment.location_id) ?? null;

    return {
      id: appointment.id,
      patientId: appointment.patient_id,
      doctorId: appointment.doctor_id,
      clinicId: appointment.clinic_id,
      locationId: appointment.location_id,
      slotId: appointment.slot_id,
      appointmentDate: appointment.appointment_date,
      startTime: appointment.start_time,
      endTime: appointment.end_time,
      reasonForVisit: appointment.reason_for_visit,
      status: appointment.status,
      cancellationReason: appointment.cancellation_reason,
      cancelledBy: appointment.cancelled_by,
      rescheduledFrom: appointment.rescheduled_from,
      createdAt: appointment.created_at,
      updatedAt: appointment.updated_at,
      patient,
      location: location ? mapLocation(location) : null,
      canShowPatientContact: contactVisibleStatuses.includes(appointment.status)
    };
  });
}

async function loadPatientsForAppointments(
  rows: AppointmentRow[]
): Promise<Map<string, DoctorAppointmentPatient>> {
  const supabase = getSupabase();
  const patientIds = Array.from(new Set(rows.map((item) => item.patient_id)));

  if (patientIds.length === 0) {
    return new Map();
  }

  const { data: patientProfiles, error } = await supabase
    .from("patient_profiles")
    .select("id, user_id, city, preferred_language")
    .in("id", patientIds);

  if (error) {
    throw error;
  }

  const userIds = Array.from(
    new Set((patientProfiles ?? []).map((item) => item.user_id))
  );
  const contactAllowedUserIds = new Set(
    rows
      .filter((item) => contactVisibleStatuses.includes(item.status))
      .map((item) => patientProfiles?.find((profile) => profile.id === item.patient_id)?.user_id)
      .filter((id): id is string => Boolean(id))
  );
  const [names, contacts] = await Promise.all([
    loadProfileNames(userIds),
    loadProfileContacts(Array.from(contactAllowedUserIds))
  ]);
  const patientProfilesById = new Map(
    (patientProfiles ?? []).map((profile) => [profile.id, profile])
  );

  return new Map(
    rows
      .map((appointment) => {
        const patientProfile = patientProfilesById.get(appointment.patient_id);

        if (!patientProfile) {
          return null;
        }

        const profileName = names.find(
          (item) => item.id === patientProfile.user_id
        );
        const canShowContact = contactVisibleStatuses.includes(
          appointment.status
        );
        const contact = canShowContact
          ? contacts.find((item) => item.id === patientProfile.user_id)
          : null;

        return [
          appointment.id,
          mapPatient(patientProfile, profileName, contact ?? null)
        ] as const;
      })
      .filter((entry): entry is readonly [string, DoctorAppointmentPatient] =>
        Boolean(entry)
      )
  );
}

async function hydrateTreatedPatients(
  rows: RelationshipRow[]
): Promise<DoctorTreatedPatient[]> {
  if (rows.length === 0) {
    return [];
  }

  const supabase = getSupabase();
  const patientIds = Array.from(new Set(rows.map((item) => item.patient_id)));
  const { data: patientProfiles, error } = await supabase
    .from("patient_profiles")
    .select("id, user_id, city, preferred_language")
    .in("id", patientIds);

  if (error) {
    throw error;
  }

  const names = await loadProfileNames(
    Array.from(new Set((patientProfiles ?? []).map((item) => item.user_id)))
  );

  return rows.map((relationship) => {
    const patient = (patientProfiles ?? []).find(
      (item) => item.id === relationship.patient_id
    );
    const profileName = names.find((item) => item.id === patient?.user_id);

    return {
      id: relationship.id,
      patientId: relationship.patient_id,
      fullName: profileName?.full_name ?? "Patient",
      city: patient?.city ?? null,
      preferredLanguage: patient?.preferred_language ?? "en",
      firstVisitDate: relationship.first_visit_date,
      lastVisitDate: relationship.last_visit_date,
      totalVisits: relationship.total_visits,
      relationshipStatus: relationship.relationship_status
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

async function loadProfileContacts(
  userIds: string[]
): Promise<ProfileContactRow[]> {
  if (userIds.length === 0) {
    return [];
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, phone")
    .in("id", userIds);

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function loadLocations(locationIds: string[]): Promise<LocationRow[]> {
  if (locationIds.length === 0) {
    return [];
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("doctor_locations")
    .select("id, custom_location_name, address, city, latitude, longitude")
    .in("id", locationIds);

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function loadAvailabilityForSlots(availabilityIds: string[]) {
  if (availabilityIds.length === 0) {
    return [];
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("doctor_availability")
    .select("id, location_id, consultation_type, is_active")
    .in("id", availabilityIds)
    .eq("is_active", true);

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function countOwnDoctorProfileViews(): Promise<number> {
  const supabase = getSupabase();
  const { data: doctorId, error: doctorError } = await supabase.rpc(
    "get_owned_doctor_id"
  );

  if (doctorError) {
    throw doctorError;
  }

  const { count, error } = await supabase
    .from("doctor_profile_views")
    .select("id", { count: "exact", head: true })
    .eq("doctor_id", doctorId);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

function mapPatient(
  patientProfile: PatientProfileRow,
  profileName: ProfileNameRow | undefined,
  profileContact: ProfileContactRow | null
): DoctorAppointmentPatient {
  return {
    id: patientProfile.id,
    userId: patientProfile.user_id,
    fullName: profileName?.full_name ?? "Patient",
    email: profileContact?.email ?? null,
    phone: profileContact?.phone ?? null,
    city: patientProfile.city,
    preferredLanguage: patientProfile.preferred_language
  };
}

function mapLocation(location: LocationRow): DoctorAppointmentLocation {
  return {
    id: location.id,
    name: location.custom_location_name,
    address: location.address,
    city: location.city,
    latitude: location.latitude,
    longitude: location.longitude
  };
}

function buildAnalytics(
  appointments: DoctorAppointment[],
  treatedPatientCount: number,
  profileViews: number
): DoctorDashboardAnalytics {
  const relevantAppointments = appointments.filter(
    (appointment) => appointment.status !== "rescheduled"
  );
  const total = relevantAppointments.length;
  const completed = appointments.filter(
    (appointment) => appointment.status === "completed"
  ).length;
  const cancelled = appointments.filter(isCancelledDoctorAppointment).length;
  const noShow = appointments.filter(
    (appointment) => appointment.status === "no_show"
  ).length;
  const patientBookingCounts = getPatientBookingCounts(relevantAppointments);
  const uniquePatients = patientBookingCounts.size;
  const mostBookedDays = getMostBookedDays(relevantAppointments);
  const mostActiveLocation = getMostActiveLocation(relevantAppointments);

  return {
    profileViews,
    totalBookings: total,
    completedAppointments: completed,
    cancelledAppointments: cancelled,
    totalAppointments: total,
    activeAppointments: appointments.filter((appointment) =>
      activeStatuses.includes(appointment.status)
    ).length,
    uniquePatients,
    treatedPatients: treatedPatientCount,
    newPatients: Array.from(patientBookingCounts.values()).filter(
      (count) => count === 1
    ).length,
    returningPatients: Array.from(patientBookingCounts.values()).filter(
      (count) => count > 1
    ).length,
    completionRate: toPercent(completed, total),
    cancellationRate: toPercent(cancelled, total),
    noShowRate: toPercent(noShow, total),
    mostBookedDays,
    mostActiveLocation
  };
}

function getPatientBookingCounts(
  appointments: DoctorAppointment[]
): Map<string, number> {
  const counts = new Map<string, number>();

  appointments.forEach((appointment) => {
    counts.set(
      appointment.patientId,
      (counts.get(appointment.patientId) ?? 0) + 1
    );
  });

  return counts;
}

function getMostBookedDays(
  appointments: DoctorAppointment[]
): DoctorAnalyticsBreakdown[] {
  const counts = new Map<string, number>();

  appointments.forEach((appointment) => {
    const label = new Intl.DateTimeFormat(undefined, {
      weekday: "short"
    }).format(new Date(`${appointment.appointmentDate}T00:00:00`));

    counts.set(label, (counts.get(label) ?? 0) + 1);
  });

  return [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((left, right) => right.value - left.value)
    .slice(0, 3);
}

function getMostActiveLocation(
  appointments: DoctorAppointment[]
): DoctorLocationAnalytics | null {
  const counts = new Map<string, DoctorLocationAnalytics>();

  appointments.forEach((appointment) => {
    const current = counts.get(appointment.locationId);
    counts.set(appointment.locationId, {
      locationId: appointment.locationId,
      label: appointment.location
        ? formatDoctorLocation(appointment.location)
        : "Location unavailable",
      value: (current?.value ?? 0) + 1
    });
  });

  return [...counts.values()].sort((left, right) => right.value - left.value)[0] ??
    null;
}

function sortAscending(appointments: DoctorAppointment[]): DoctorAppointment[] {
  return [...appointments].sort(
    (a, b) =>
      getDoctorAppointmentStart(a).getTime() -
      getDoctorAppointmentStart(b).getTime()
  );
}

function sortDescending(appointments: DoctorAppointment[]): DoctorAppointment[] {
  return [...appointments].sort(
    (a, b) =>
      getDoctorAppointmentStart(b).getTime() -
      getDoctorAppointmentStart(a).getTime()
  );
}

function getTodayIsoDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function toPercent(value: number, total: number): number {
  if (total === 0) {
    return 0;
  }

  return Math.round((value / total) * 100);
}
