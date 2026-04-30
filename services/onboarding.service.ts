import { getSupabase } from "@/lib/supabase";
import { updateOwnProfile } from "@/services/profile.service";

function splitCsv(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export type PatientOnboardingInput = {
  fullName: string;
  phone: string;
  city: string;
  preferredLanguage: string;
  dateOfBirth?: string;
};

export type DoctorOnboardingInput = {
  fullName: string;
  title: string;
  registrationNumber: string;
  qualifications: string;
  specialty: string;
  subspecialty?: string;
  yearsOfExperience: number;
  languages: string;
  consultationFee: number;
  services: string;
  biography: string;
  visitingLocationName: string;
  visitingAddress: string;
  visitingCity: string;
  firstAvailableDate: string;
  startTime: string;
  endTime: string;
  appointmentDurationMinutes: number;
  profilePhotoUri?: string | null;
};

export type ClinicAdminOnboardingInput = {
  clinicName: string;
  clinicEmail: string;
  clinicPhone: string;
  website?: string;
  clinicAddress: string;
  city: string;
  clinicLocation: string;
};

export async function completePatientOnboarding(
  values: PatientOnboardingInput
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
    throw new Error("You must be signed in to complete onboarding.");
  }

  await updateOwnProfile({
    fullName: values.fullName,
    phone: values.phone
  });

  const { error } = await supabase.from("patient_profiles").upsert(
    {
      user_id: user.id,
      date_of_birth: values.dateOfBirth || null,
      city: values.city,
      preferred_language: values.preferredLanguage
    },
    { onConflict: "user_id" }
  );

  if (error) {
    throw error;
  }
}

export async function completeDoctorOnboarding(
  values: DoctorOnboardingInput
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
    throw new Error("You must be signed in to complete onboarding.");
  }

  const profileImageUrl = values.profilePhotoUri
    ? await uploadDoctorProfilePhoto(user.id, values.profilePhotoUri)
    : null;

  await updateOwnProfile({
    fullName: values.fullName,
    avatarUrl: profileImageUrl
  });

  const { data: doctorProfile, error } = await supabase.from("doctor_profiles").upsert(
    {
      user_id: user.id,
      title: values.title,
      full_name: values.fullName,
      profile_image_url: profileImageUrl,
      registration_number: values.registrationNumber,
      qualifications: splitCsv(values.qualifications),
      specialties: [values.specialty.trim()],
      subspecialties: splitCsv(values.subspecialty ?? ""),
      services: splitCsv(values.services),
      years_of_experience: values.yearsOfExperience,
      languages: splitCsv(values.languages),
      biography: values.biography,
      consultation_fee: values.consultationFee,
      verification_status: "pending",
      is_public: false
    },
    { onConflict: "user_id" }
  ).select("id").single();

  if (error) {
    throw error;
  }

  const { data: location, error: locationError } = await supabase
    .from("doctor_locations")
    .insert({
      doctor_id: doctorProfile.id,
      custom_location_name: values.visitingLocationName.trim(),
      address: values.visitingAddress.trim(),
      city: values.visitingCity.trim(),
      is_active: true
    })
    .select("id")
    .single();

  if (locationError) {
    throw locationError;
  }

  const { error: availabilityError } = await supabase.rpc(
    "create_doctor_availability_with_slots",
    {
      target_location_id: location.id,
      target_date: values.firstAvailableDate,
      target_start_time: normalizeTime(values.startTime),
      target_end_time: normalizeTime(values.endTime),
      target_appointment_duration_minutes: values.appointmentDurationMinutes,
      target_break_minutes: 0,
      target_max_patients: 1,
      target_consultation_type: "in_person",
      target_is_active: true
    }
  );

  if (availabilityError) {
    throw availabilityError;
  }
}

export async function completeClinicAdminOnboarding(
  values: ClinicAdminOnboardingInput
): Promise<void> {
  const supabase = getSupabase();
  const { data: clinicId, error } = await supabase.rpc("complete_clinic_admin_onboarding", {
    clinic_name: values.clinicName,
    clinic_email: values.clinicEmail,
    clinic_phone: values.clinicPhone,
    location_address: values.clinicAddress || values.clinicLocation,
    location_city: values.city || values.clinicLocation
  });

  if (error) {
    throw error;
  }

  if (values.website?.trim() && clinicId) {
    const { error: websiteError } = await supabase
      .from("clinics")
      .update({ website: values.website.trim() })
      .eq("id", clinicId);

    if (websiteError) {
      throw websiteError;
    }
  }
}

function normalizeTime(value: string): string {
  const [hours = "00", minutes = "00"] = value.split(":");
  return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}:00`;
}

async function uploadDoctorProfilePhoto(
  userId: string,
  uri: string
): Promise<string> {
  const supabase = getSupabase();
  const extension = uri.split(".").pop()?.toLowerCase() || "jpg";
  const normalizedExtension = extension === "jpg" ? "jpeg" : extension;
  const path = `${userId}/doctor-profile-${Date.now()}.${extension}`;
  const response = await fetch(uri);
  const arrayBuffer = await response.arrayBuffer();

  const { error } = await supabase.storage.from("avatars").upload(path, arrayBuffer, {
    contentType: `image/${normalizedExtension}`,
    upsert: true
  });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);

  return data.publicUrl;
}
