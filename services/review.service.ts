import { getSupabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

export type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"];

export type AppointmentReviewInput = {
  appointmentId: string;
  rating: number;
  comment?: string;
  isPublic: boolean;
};

export type AppReview = {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  rating: number;
  comment: string | null;
  isPublic: boolean;
  createdAt: string;
};

export type DoctorReview = AppReview & {
  patientName: string | null;
};

export type AdminReview = AppReview & {
  doctorName: string | null;
  doctorSpecialties: string[];
  patientName: string | null;
};

export async function createAppointmentReview({
  appointmentId,
  comment,
  isPublic,
  rating
}: AppointmentReviewInput): Promise<string> {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("create_patient_review", {
    target_appointment_id: appointmentId,
    target_rating: rating,
    review_comment: comment?.trim() || null,
    make_comment_public: isPublic
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function listOwnDoctorReviews(): Promise<DoctorReview[]> {
  const supabase = getSupabase();
  const { data: doctorId, error: doctorError } = await supabase.rpc(
    "get_owned_doctor_id"
  );

  if (doctorError) {
    throw doctorError;
  }

  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("doctor_id", doctorId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw error;
  }

  return hydrateDoctorReviews((data ?? []).map(mapReviewRow));
}

export async function listAdminReviews(): Promise<AdminReview[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(250);

  if (error) {
    throw error;
  }

  return hydrateAdminReviews((data ?? []).map(mapReviewRow));
}

export async function hideReview({
  note,
  reviewId
}: {
  note?: string;
  reviewId: string;
}): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.rpc("admin_hide_review", {
    target_review_id: reviewId,
    moderation_note: note ?? null
  });

  if (error) {
    throw error;
  }
}

export function formatRating(rating: number): string {
  return `${rating}/5`;
}

function mapReviewRow(row: ReviewRow): AppReview {
  return {
    id: row.id,
    appointmentId: row.appointment_id,
    patientId: row.patient_id,
    doctorId: row.doctor_id,
    rating: row.rating,
    comment: row.comment,
    isPublic: row.is_public,
    createdAt: row.created_at
  };
}

async function hydrateDoctorReviews(reviews: AppReview[]): Promise<DoctorReview[]> {
  const patientNames = await loadPatientNames(
    Array.from(new Set(reviews.map((review) => review.patientId)))
  );

  return reviews.map((review) => ({
    ...review,
    patientName: patientNames.get(review.patientId) ?? null
  }));
}

async function hydrateAdminReviews(reviews: AppReview[]): Promise<AdminReview[]> {
  const [patientNames, doctorProfiles] = await Promise.all([
    loadPatientNames(Array.from(new Set(reviews.map((review) => review.patientId)))),
    loadDoctorProfiles(Array.from(new Set(reviews.map((review) => review.doctorId))))
  ]);

  return reviews.map((review) => {
    const doctor = doctorProfiles.get(review.doctorId);

    return {
      ...review,
      doctorName: doctor?.fullName ?? null,
      doctorSpecialties: doctor?.specialties ?? [],
      patientName: patientNames.get(review.patientId) ?? null
    };
  });
}

async function loadPatientNames(patientIds: string[]): Promise<Map<string, string>> {
  if (patientIds.length === 0) {
    return new Map();
  }

  const supabase = getSupabase();
  const { data: patients, error: patientError } = await supabase
    .from("patient_profiles")
    .select("id, user_id")
    .in("id", patientIds);

  if (patientError) {
    throw patientError;
  }

  const userIds = (patients ?? []).map((patient) => patient.user_id);

  if (userIds.length === 0) {
    return new Map();
  }

  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", userIds);

  if (profileError) {
    throw profileError;
  }

  const profileByUserId = new Map(
    (profiles ?? []).map((profile) => [
      profile.id,
      profile.full_name ?? profile.email ?? "Patient"
    ])
  );

  return new Map(
    (patients ?? []).map((patient) => [
      patient.id,
      profileByUserId.get(patient.user_id) ?? "Patient"
    ])
  );
}

async function loadDoctorProfiles(
  doctorIds: string[]
): Promise<Map<string, { fullName: string; specialties: string[] }>> {
  if (doctorIds.length === 0) {
    return new Map();
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("doctor_profiles")
    .select("id, full_name, specialties")
    .in("id", doctorIds);

  if (error) {
    throw error;
  }

  return new Map(
    (data ?? []).map((doctor) => [
      doctor.id,
      {
        fullName: doctor.full_name,
        specialties: doctor.specialties
      }
    ])
  );
}
