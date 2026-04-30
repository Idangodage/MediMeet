import { getSupabase } from "@/lib/supabase";
import type { AppReview } from "@/services/review.service";
import type { Database } from "@/types/supabase";

export type AppointmentStatus =
  Database["public"]["Enums"]["appointment_status"];

export type PatientAppointmentDoctor = {
  id: string;
  title: string | null;
  fullName: string;
  profileImageUrl: string | null;
  specialties: string[];
  qualifications: string[];
  yearsOfExperience: number;
  consultationFee: number;
};

export type PatientAppointmentLocation = {
  id: string;
  name: string | null;
  address: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type PatientAppointment = {
  id: string;
  doctorId: string;
  locationId: string;
  slotId: string | null;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  reasonForVisit: string | null;
  status: AppointmentStatus;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
  doctor: PatientAppointmentDoctor | null;
  location: PatientAppointmentLocation | null;
  isFavouriteDoctor: boolean;
  review: AppReview | null;
};

export type PatientDashboardSummary = {
  upcoming: PatientAppointment[];
  previous: PatientAppointment[];
  cancelled: PatientAppointment[];
  reviewRequests: PatientAppointment[];
  favouritesCount: number;
  visitedDoctorsCount: number;
};

export type PatientDoctorListItem = PatientAppointmentDoctor & {
  firstVisitDate: string | null;
  lastVisitDate: string | null;
  totalVisits: number;
  isFavourite: boolean;
};

export type PatientProfileSettings = {
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  city: string;
  preferredLanguage: string;
};

type AppointmentRow = Database["public"]["Tables"]["appointments"]["Row"];
type DoctorRow = Pick<
  Database["public"]["Tables"]["doctor_profiles"]["Row"],
  | "id"
  | "title"
  | "full_name"
  | "profile_image_url"
  | "specialties"
  | "qualifications"
  | "years_of_experience"
  | "consultation_fee"
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

export async function getPatientDashboardSummary(): Promise<
  PatientDashboardSummary
> {
  const [appointments, favouriteDoctors, visitedDoctors] = await Promise.all([
    listOwnPatientAppointments(),
    listFavouriteDoctors(),
    listVisitedDoctors()
  ]);

  return {
    upcoming: appointments
      .filter(isUpcomingAppointment)
      .sort((a, b) => getAppointmentStart(a).getTime() - getAppointmentStart(b).getTime()),
    previous: appointments
      .filter(isPreviousAppointment)
      .sort((a, b) => getAppointmentStart(b).getTime() - getAppointmentStart(a).getTime()),
    cancelled: appointments
      .filter(isCancelledAppointment)
      .sort((a, b) => getAppointmentStart(b).getTime() - getAppointmentStart(a).getTime()),
    reviewRequests: appointments
      .filter(canReviewAppointment)
      .sort((a, b) => getAppointmentStart(b).getTime() - getAppointmentStart(a).getTime()),
    favouritesCount: favouriteDoctors.length,
    visitedDoctorsCount: visitedDoctors.length
  };
}

export async function listOwnPatientAppointments(): Promise<
  PatientAppointment[]
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

export async function getOwnPatientAppointment(
  appointmentId: string
): Promise<PatientAppointment | null> {
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

export async function cancelOwnAppointment({
  appointmentId,
  reason
}: {
  appointmentId: string;
  reason?: string;
}): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.rpc("cancel_patient_appointment", {
    target_appointment_id: appointmentId,
    cancellation_reason: reason?.trim() || null
  });

  if (error) {
    throw error;
  }
}

export async function listFavouriteDoctors(): Promise<PatientDoctorListItem[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("patient_favourite_doctors")
    .select("doctor_id, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const doctorIds = (data ?? []).map((item) => item.doctor_id);
  const doctors = await loadDoctors(doctorIds);

  return doctors.map((doctor) => ({
    ...mapDoctor(doctor),
    firstVisitDate: null,
    lastVisitDate: null,
    totalVisits: 0,
    isFavourite: true
  }));
}

export async function listVisitedDoctors(): Promise<PatientDoctorListItem[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("doctor_patient_relationships")
    .select("*")
    .eq("relationship_status", "active")
    .order("last_visit_date", { ascending: false, nullsFirst: false });

  if (error) {
    throw error;
  }

  return hydrateVisitedDoctors(data ?? []);
}

export async function setFavouriteDoctor({
  doctorId,
  isFavourite
}: {
  doctorId: string;
  isFavourite: boolean;
}): Promise<void> {
  const supabase = getSupabase();
  const patientId = await getOwnPatientId();

  if (isFavourite) {
    const { error } = await supabase
      .from("patient_favourite_doctors")
      .upsert(
        {
          patient_id: patientId,
          doctor_id: doctorId
        },
        { onConflict: "patient_id,doctor_id" }
      );

    if (error) {
      throw error;
    }

    return;
  }

  const { error } = await supabase
    .from("patient_favourite_doctors")
    .delete()
    .eq("patient_id", patientId)
    .eq("doctor_id", doctorId);

  if (error) {
    throw error;
  }
}

export async function getOwnPatientProfileSettings(): Promise<
  PatientProfileSettings
> {
  const supabase = getSupabase();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("You must be signed in to view profile settings.");
  }

  const [{ data: profile, error: profileError }, { data: patient, error }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, email, phone")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("patient_profiles")
        .select("date_of_birth, city, preferred_language")
        .eq("user_id", user.id)
        .maybeSingle()
    ]);

  if (profileError) {
    throw profileError;
  }

  if (error) {
    throw error;
  }

  if (!patient) {
    throw new Error("Complete patient onboarding before editing settings.");
  }

  return {
    fullName: profile?.full_name ?? "",
    email: profile?.email ?? user.email ?? "",
    phone: profile?.phone ?? "",
    dateOfBirth: patient.date_of_birth ?? "",
    city: patient.city ?? "",
    preferredLanguage: patient.preferred_language ?? "en"
  };
}

export async function updateOwnPatientProfileSettings(
  values: PatientProfileSettings
): Promise<void> {
  const supabase = getSupabase();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("You must be signed in to update profile settings.");
  }

  const profileUpdate = supabase
    .from("profiles")
    .update({
      full_name: values.fullName.trim(),
      phone: values.phone.trim()
    })
    .eq("id", user.id);
  const patientUpdate = supabase
    .from("patient_profiles")
    .update({
      date_of_birth: values.dateOfBirth.trim() || null,
      city: values.city.trim(),
      preferred_language: values.preferredLanguage.trim()
    })
    .eq("user_id", user.id);
  const [{ error: profileError }, { error }] = await Promise.all([
    profileUpdate,
    patientUpdate
  ]);

  if (profileError) {
    throw profileError;
  }

  if (error) {
    throw error;
  }
}

export async function markNotificationAsRead(
  notificationId: string
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("notifications")
    .update({ read_status: "read" })
    .eq("id", notificationId);

  if (error) {
    throw error;
  }
}

export function getAppointmentStart(appointment: Pick<
  PatientAppointment,
  "appointmentDate" | "startTime"
>): Date {
  return new Date(`${appointment.appointmentDate}T${appointment.startTime}`);
}

export function isCancelledAppointment(
  appointment: Pick<PatientAppointment, "status">
): boolean {
  return [
    "cancelled",
    "cancelled_by_patient",
    "cancelled_by_doctor"
  ].includes(appointment.status);
}

export function isUpcomingAppointment(appointment: PatientAppointment): boolean {
  return (
    !isCancelledAppointment(appointment) &&
    !["completed", "no_show", "rescheduled"].includes(appointment.status) &&
    getAppointmentStart(appointment).getTime() >= Date.now()
  );
}

export function isPreviousAppointment(appointment: PatientAppointment): boolean {
  return (
    !isCancelledAppointment(appointment) &&
    (["completed", "no_show", "rescheduled"].includes(appointment.status) ||
      getAppointmentStart(appointment).getTime() < Date.now())
  );
}

export function canCancelAppointment(appointment: PatientAppointment): boolean {
  return (
    ["requested", "pending", "confirmed"].includes(appointment.status) &&
    getAppointmentStart(appointment).getTime() > Date.now()
  );
}

export function canRescheduleAppointment(
  appointment: PatientAppointment
): boolean {
  return canCancelAppointment(appointment);
}

export function canReviewAppointment(appointment: PatientAppointment): boolean {
  return appointment.status === "completed" && !appointment.review;
}

export function formatAppointmentStatus(status: AppointmentStatus): string {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function hydrateAppointments(
  rows: AppointmentRow[]
): Promise<PatientAppointment[]> {
  const doctorIds = Array.from(new Set(rows.map((item) => item.doctor_id)));
  const locationIds = Array.from(new Set(rows.map((item) => item.location_id)));
  const appointmentIds = rows.map((item) => item.id);
  const [doctors, locations, favouriteIds, reviews] = await Promise.all([
    loadDoctors(doctorIds),
    loadLocations(locationIds),
    listFavouriteDoctorIds(doctorIds),
    loadAppointmentReviews(appointmentIds)
  ]);
  const reviewByAppointmentId = new Map(
    reviews.map((review) => [review.appointmentId, review])
  );

  return rows.map((appointment) => {
    const doctor =
      doctors.find((item) => item.id === appointment.doctor_id) ?? null;
    const location =
      locations.find((item) => item.id === appointment.location_id) ?? null;

    return {
      id: appointment.id,
      doctorId: appointment.doctor_id,
      locationId: appointment.location_id,
      slotId: appointment.slot_id,
      appointmentDate: appointment.appointment_date,
      startTime: appointment.start_time,
      endTime: appointment.end_time,
      reasonForVisit: appointment.reason_for_visit,
      status: appointment.status,
      cancellationReason: appointment.cancellation_reason,
      createdAt: appointment.created_at,
      updatedAt: appointment.updated_at,
      doctor: doctor ? mapDoctor(doctor) : null,
      location: location ? mapLocation(location) : null,
      isFavouriteDoctor: favouriteIds.has(appointment.doctor_id),
      review: reviewByAppointmentId.get(appointment.id) ?? null
    };
  });
}

async function loadAppointmentReviews(
  appointmentIds: string[]
): Promise<AppReview[]> {
  if (appointmentIds.length === 0) {
    return [];
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .in("appointment_id", appointmentIds);

  if (error) {
    throw error;
  }

  return (data ?? []).map((review) => ({
    id: review.id,
    appointmentId: review.appointment_id,
    patientId: review.patient_id,
    doctorId: review.doctor_id,
    rating: review.rating,
    comment: review.comment,
    isPublic: review.is_public,
    createdAt: review.created_at
  }));
}

async function loadDoctors(doctorIds: string[]): Promise<DoctorRow[]> {
  if (doctorIds.length === 0) {
    return [];
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("doctor_profiles")
    .select(
      "id, title, full_name, profile_image_url, specialties, qualifications, years_of_experience, consultation_fee"
    )
    .in("id", doctorIds);

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

async function hydrateVisitedDoctors(
  relationships: RelationshipRow[]
): Promise<PatientDoctorListItem[]> {
  if (relationships.length === 0) {
    return [];
  }

  const doctorIds = Array.from(
    new Set(relationships.map((relationship) => relationship.doctor_id))
  );
  const [doctors, favouriteIds] = await Promise.all([
    loadDoctors(doctorIds),
    listFavouriteDoctorIds(doctorIds)
  ]);

  return relationships
    .map((relationship) => {
      const doctor = doctors.find(
        (item) => item.id === relationship.doctor_id
      );

      if (!doctor) {
        return null;
      }

      return {
        ...mapDoctor(doctor),
        firstVisitDate: relationship.first_visit_date,
        lastVisitDate: relationship.last_visit_date,
        totalVisits: relationship.total_visits,
        isFavourite: favouriteIds.has(relationship.doctor_id)
      };
    })
    .filter((doctor): doctor is PatientDoctorListItem => Boolean(doctor));
}

async function listFavouriteDoctorIds(doctorIds: string[]): Promise<Set<string>> {
  if (doctorIds.length === 0) {
    return new Set();
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("patient_favourite_doctors")
    .select("doctor_id")
    .in("doctor_id", doctorIds);

  if (error) {
    throw error;
  }

  return new Set((data ?? []).map((item) => item.doctor_id));
}

async function getOwnPatientId(): Promise<string> {
  const supabase = getSupabase();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("You must be signed in as a patient.");
  }

  const { data, error } = await supabase
    .from("patient_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Complete patient onboarding first.");
  }

  return data.id;
}

function mapDoctor(doctor: DoctorRow): PatientAppointmentDoctor {
  return {
    id: doctor.id,
    title: doctor.title,
    fullName: doctor.full_name,
    profileImageUrl: doctor.profile_image_url,
    specialties: doctor.specialties ?? [],
    qualifications: doctor.qualifications ?? [],
    yearsOfExperience: doctor.years_of_experience,
    consultationFee: Number(doctor.consultation_fee)
  };
}

function mapLocation(location: LocationRow): PatientAppointmentLocation {
  return {
    id: location.id,
    name: location.custom_location_name,
    address: location.address,
    city: location.city,
    latitude: location.latitude,
    longitude: location.longitude
  };
}
