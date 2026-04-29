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
};

export type DoctorOnboardingInput = {
  fullName: string;
  title: string;
  registrationNumber: string;
  qualifications: string;
  specialty: string;
  yearsOfExperience: number;
  languages: string;
  consultationFee: number;
  biography: string;
  profilePhotoUri?: string | null;
};

export type ClinicAdminOnboardingInput = {
  clinicName: string;
  clinicEmail: string;
  clinicPhone: string;
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

  const { error } = await supabase.from("doctor_profiles").upsert(
    {
      user_id: user.id,
      title: values.title,
      full_name: values.fullName,
      profile_image_url: profileImageUrl,
      registration_number: values.registrationNumber,
      qualifications: splitCsv(values.qualifications),
      specialties: [values.specialty.trim()],
      years_of_experience: values.yearsOfExperience,
      languages: splitCsv(values.languages),
      biography: values.biography,
      consultation_fee: values.consultationFee,
      verification_status: "pending",
      is_public: false
    },
    { onConflict: "user_id" }
  );

  if (error) {
    throw error;
  }
}

export async function completeClinicAdminOnboarding(
  values: ClinicAdminOnboardingInput
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.rpc("complete_clinic_admin_onboarding", {
    clinic_name: values.clinicName,
    clinic_email: values.clinicEmail,
    clinic_phone: values.clinicPhone,
    location_address: values.clinicLocation,
    location_city: values.clinicLocation
  });

  if (error) {
    throw error;
  }
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
