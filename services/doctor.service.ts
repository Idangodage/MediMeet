import { getSupabase } from "@/lib/supabase";
import { assertCanSaveDoctorLocation } from "@/services/subscription.service";

export type ConsultationType = "in_person" | "video" | "phone";
export type VerificationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "needs_review"
  | "suspended";
export type DoctorProfileStatus =
  | "incomplete"
  | "pending_verification"
  | "verified"
  | "rejected"
  | "needs_update"
  | "suspended";

export type DoctorSearchFilters = {
  specialty?: string;
  city?: string;
  language?: string;
  availabilityDate?: string;
  minFee?: number;
  maxFee?: number;
  verificationStatus?: VerificationStatus;
  consultationType?: ConsultationType;
};

export type PublicDoctorLocation = {
  id: string;
  name: string | null;
  address: string | null;
  city: string | null;
  isActive?: boolean;
};

export type PublicDoctorAvailableSlot = {
  id: string;
  availabilityId: string;
  locationId: string;
  startTime: string;
  endTime: string;
  consultationType: ConsultationType;
};

export type PublicDoctorReview = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
};

export type PublicDoctor = {
  id: string;
  fullName: string;
  title: string | null;
  profileImageUrl: string | null;
  qualifications: string[];
  specialties: string[];
  subspecialties: string[];
  services: string[];
  languages: string[];
  biography: string | null;
  consultationFee: number;
  averageRating: number;
  yearsOfExperience: number;
  verificationStatus: VerificationStatus;
  isPublic: boolean;
  locations: PublicDoctorLocation[];
  availableSlots: PublicDoctorAvailableSlot[];
  reviews: PublicDoctorReview[];
};

export type ManagedDoctorProfile = PublicDoctor & {
  userId: string;
  registrationNumber: string;
  createdAt: string;
  updatedAt: string;
};

export type DoctorProfileCompletion = {
  percentage: number;
  completedFields: number;
  totalFields: number;
  missingFields: string[];
  status: DoctorProfileStatus;
};

export type DoctorProfileUpdateInput = {
  profilePhotoUri?: string | null;
  title: string;
  fullName: string;
  qualifications: string;
  registrationNumber: string;
  specialties: string;
  subspecialties: string;
  yearsOfExperience: number;
  languages: string;
  biography: string;
  consultationFee: number;
  services: string;
};

export type DoctorLocationInput = {
  id?: string;
  doctorId: string;
  name: string;
  address: string;
  city: string;
  isActive: boolean;
};

type DoctorRow = {
  id: string;
  user_id?: string;
  full_name: string;
  title: string | null;
  profile_image_url: string | null;
  registration_number?: string;
  qualifications: string[];
  specialties: string[];
  subspecialties: string[];
  services: string[];
  languages: string[];
  biography: string | null;
  consultation_fee: number;
  average_rating: number;
  years_of_experience: number;
  verification_status: VerificationStatus;
  is_public: boolean;
  created_at?: string;
  updated_at?: string;
};

type DoctorLocationRow = PublicDoctorLocation & {
  doctorId: string;
};

export async function listPublicDoctors(
  filters: DoctorSearchFilters = {}
): Promise<PublicDoctor[]> {
  const doctors = await loadPublicDoctors();
  const doctorIds = doctors.map((doctor) => doctor.id);

  if (doctorIds.length === 0) {
    return [];
  }

  const [locations, availability, slots, reviews] = await Promise.all([
    loadDoctorLocations(doctorIds),
    loadDoctorAvailability(doctorIds),
    loadAvailableSlots(doctorIds),
    loadDoctorReviews(doctorIds)
  ]);

  const doctorsWithDiscovery = doctors.map((doctor) =>
    hydrateDoctor(doctor, locations, availability, slots, reviews)
  );

  return doctorsWithDiscovery.filter((doctor) =>
    matchesDoctorFilters(doctor, filters)
  );
}

export async function getPublicDoctorById(
  doctorId: string
): Promise<PublicDoctor | null> {
  const doctors = await loadPublicDoctors();
  const doctor = doctors.find((item) => item.id === doctorId);

  if (!doctor) {
    return null;
  }

  const [locations, availability, slots, reviews] = await Promise.all([
    loadDoctorLocations([doctorId]),
    loadDoctorAvailability([doctorId]),
    loadAvailableSlots([doctorId]),
    loadDoctorReviews([doctorId])
  ]);

  return hydrateDoctor(doctor, locations, availability, slots, reviews);
}

export async function bookPublicAppointment({
  slotId,
  reasonForVisit
}: {
  slotId: string;
  reasonForVisit?: string;
}): Promise<string> {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("book_public_appointment", {
    target_slot_id: slotId,
    reason_for_visit: reasonForVisit ?? null
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function recordDoctorProfileView(doctorId: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.rpc("record_doctor_profile_view", {
    target_doctor_id: doctorId
  });

  if (error) {
    throw error;
  }
}

export async function getOwnDoctorProfile(): Promise<ManagedDoctorProfile | null> {
  const supabase = getSupabase();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("You must be signed in to manage your doctor profile.");
  }

  const { data, error } = await supabase
    .from("doctor_profiles")
    .select(
      "id, user_id, full_name, title, profile_image_url, registration_number, qualifications, specialties, subspecialties, services, languages, biography, consultation_fee, average_rating, years_of_experience, verification_status, is_public, created_at, updated_at"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const [locations, availability, slots, reviews] = await Promise.all([
    loadDoctorLocations([data.id], { includeInactive: true }),
    loadDoctorAvailability([data.id], { includeInactive: true }),
    loadAvailableSlots([data.id], { includeBooked: true }),
    loadDoctorReviews([data.id])
  ]);
  const hydratedProfile = hydrateDoctor(
    {
      ...data,
      consultation_fee: Number(data.consultation_fee),
      average_rating: Number(data.average_rating)
    },
    locations,
    availability,
    slots,
    reviews
  );

  return {
    ...hydratedProfile,
    userId: data.user_id,
    registrationNumber: data.registration_number,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

export async function updateOwnDoctorProfile(
  values: DoctorProfileUpdateInput
): Promise<void> {
  const currentProfile = await getOwnDoctorProfile();

  if (!currentProfile) {
    throw new Error("Complete doctor onboarding before editing your profile.");
  }

  const supabase = getSupabase();
  const profileImageUrl = values.profilePhotoUri
    ? await uploadDoctorProfilePhoto(currentProfile.userId, values.profilePhotoUri)
    : currentProfile.profileImageUrl;

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: values.fullName.trim(),
      avatar_url: profileImageUrl
    })
    .eq("id", currentProfile.userId);

  if (profileError) {
    throw profileError;
  }

  const { error } = await supabase
    .from("doctor_profiles")
    .update({
      title: values.title.trim(),
      full_name: values.fullName.trim(),
      profile_image_url: profileImageUrl,
      registration_number: values.registrationNumber.trim(),
      qualifications: splitCsv(values.qualifications),
      specialties: splitCsv(values.specialties),
      subspecialties: splitCsv(values.subspecialties),
      services: splitCsv(values.services),
      years_of_experience: values.yearsOfExperience,
      languages: splitCsv(values.languages),
      biography: values.biography.trim(),
      consultation_fee: values.consultationFee
    })
    .eq("id", currentProfile.id);

  if (error) {
    throw error;
  }
}

export async function upsertDoctorLocation(
  values: DoctorLocationInput
): Promise<void> {
  await assertCanSaveDoctorLocation({
    doctorId: values.doctorId,
    isActive: values.isActive,
    locationId: values.id
  });

  const supabase = getSupabase();
  const payload = {
    doctor_id: values.doctorId,
    custom_location_name: values.name.trim(),
    address: values.address.trim(),
    city: values.city.trim(),
    is_active: values.isActive
  };

  const query = values.id
    ? supabase.from("doctor_locations").update(payload).eq("id", values.id)
    : supabase.from("doctor_locations").insert(payload);
  const { error } = await query;

  if (error) {
    throw error;
  }
}

async function loadPublicDoctors(): Promise<DoctorRow[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("doctor_profiles")
    .select(
      "id, full_name, title, profile_image_url, qualifications, specialties, subspecialties, services, languages, biography, consultation_fee, average_rating, years_of_experience, verification_status, is_public"
    )
    .eq("is_public", true)
    .eq("verification_status", "approved")
    .order("average_rating", { ascending: false });

  if (error) {
    throw error;
  }

  return data.map((doctor) => ({
    ...doctor,
    consultation_fee: Number(doctor.consultation_fee),
    average_rating: Number(doctor.average_rating)
  }));
}

async function loadDoctorLocations(
  doctorIds: string[],
  options: { includeInactive?: boolean } = {}
): Promise<DoctorLocationRow[]> {
  const supabase = getSupabase();
  let query = supabase
    .from("doctor_locations")
    .select("id, doctor_id, clinic_location_id, custom_location_name, address, city, is_active")
    .in("doctor_id", doctorIds);

  if (!options.includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  const clinicLocationIds = data
    .map((location) => location.clinic_location_id)
    .filter((id): id is string => Boolean(id));
  const clinicLocations =
    clinicLocationIds.length > 0
      ? await loadClinicLocations(clinicLocationIds)
      : [];

  return data.map((location) => ({
    id: location.id,
    doctorId: location.doctor_id,
    name: location.custom_location_name,
    address:
      location.address ??
      clinicLocations.find((item) => item.id === location.clinic_location_id)
        ?.address ??
      null,
    city:
      location.city ??
      clinicLocations.find((item) => item.id === location.clinic_location_id)
        ?.city ??
      null,
    isActive: location.is_active
  }));
}

async function loadClinicLocations(clinicLocationIds: string[]) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("clinic_locations")
    .select("id, address, city")
    .in("id", clinicLocationIds);

  if (error) {
    throw error;
  }

  return data;
}

async function loadDoctorAvailability(
  doctorIds: string[],
  options: { includeInactive?: boolean } = {}
) {
  const supabase = getSupabase();
  const today = new Date().toISOString().slice(0, 10);
  let query = supabase
    .from("doctor_availability")
    .select("id, doctor_id, location_id, date, consultation_type")
    .in("doctor_id", doctorIds)
    .gte("date", today);

  if (!options.includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data;
}

async function loadAvailableSlots(
  doctorIds: string[],
  options: { includeBooked?: boolean } = {}
) {
  const supabase = getSupabase();
  let query = supabase
    .from("appointment_slots")
    .select("id, doctor_id, availability_id, start_time, end_time")
    .in("doctor_id", doctorIds)
    .gt("start_time", new Date().toISOString())
    .order("start_time", { ascending: true });

  if (!options.includeBooked) {
    query = query.eq("status", "available");
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data;
}

async function loadDoctorReviews(doctorIds: string[]) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("reviews")
    .select("id, doctor_id, rating, comment, created_at")
    .in("doctor_id", doctorIds)
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

function hydrateDoctor(
  doctor: DoctorRow,
  locations: DoctorLocationRow[],
  availability: Array<{
    id: string;
    doctor_id: string;
    location_id: string;
    consultation_type: ConsultationType;
  }>,
  slots: Array<{
    id: string;
    doctor_id: string;
    availability_id: string;
    start_time: string;
    end_time: string;
  }>,
  reviews: Array<{
    id: string;
    doctor_id: string;
    rating: number;
    comment: string | null;
    created_at: string;
  }>
): PublicDoctor {
  const doctorAvailability = availability.filter(
    (item) => item.doctor_id === doctor.id
  );
  const doctorSlots = slots
    .filter((slot) => slot.doctor_id === doctor.id)
    .map((slot) => {
      const availabilityForSlot = doctorAvailability.find(
        (item) => item.id === slot.availability_id
      );

      return {
        id: slot.id,
        availabilityId: slot.availability_id,
        locationId: availabilityForSlot?.location_id ?? "",
        startTime: slot.start_time,
        endTime: slot.end_time,
        consultationType: availabilityForSlot?.consultation_type ?? "in_person"
      };
    })
    .filter((slot) => Boolean(slot.locationId));

  return {
    id: doctor.id,
    fullName: doctor.full_name,
    title: doctor.title,
    profileImageUrl: doctor.profile_image_url,
    qualifications: doctor.qualifications,
    specialties: doctor.specialties,
    subspecialties: doctor.subspecialties,
    services: doctor.services,
    languages: doctor.languages,
    biography: doctor.biography,
    consultationFee: doctor.consultation_fee,
    averageRating: doctor.average_rating,
    yearsOfExperience: doctor.years_of_experience,
    verificationStatus: doctor.verification_status,
    isPublic: doctor.is_public,
    locations: locations
      .filter((location) => location.doctorId === doctor.id)
      .map(({ doctorId: _doctorId, ...location }) => location),
    availableSlots: doctorSlots,
    reviews: reviews
      .filter((review) => review.doctor_id === doctor.id)
      .map((review) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.created_at
      }))
  };
}

function matchesDoctorFilters(
  doctor: PublicDoctor,
  filters: DoctorSearchFilters
): boolean {
  if (
    filters.specialty &&
    !doctor.specialties.some((specialty) =>
      includesText(specialty, filters.specialty)
    )
  ) {
    return false;
  }

  if (
    filters.city &&
    !doctor.locations.some((location) =>
      [location.city, location.address, location.name].some((value) =>
        includesText(value, filters.city)
      )
    )
  ) {
    return false;
  }

  if (
    filters.language &&
    !doctor.languages.some((language) => includesText(language, filters.language))
  ) {
    return false;
  }

  if (
    filters.availabilityDate &&
    !doctor.availableSlots.some((slot) =>
      slot.startTime.startsWith(filters.availabilityDate ?? "")
    )
  ) {
    return false;
  }

  if (
    filters.consultationType &&
    !doctor.availableSlots.some(
      (slot) => slot.consultationType === filters.consultationType
    )
  ) {
    return false;
  }

  if (
    filters.verificationStatus &&
    doctor.verificationStatus !== filters.verificationStatus
  ) {
    return false;
  }

  if (filters.minFee !== undefined && doctor.consultationFee < filters.minFee) {
    return false;
  }

  if (filters.maxFee !== undefined && doctor.consultationFee > filters.maxFee) {
    return false;
  }

  return true;
}

export function calculateDoctorProfileCompletion(
  profile: ManagedDoctorProfile | null
): DoctorProfileCompletion {
  if (!profile) {
    return {
      percentage: 0,
      completedFields: 0,
      totalFields: REQUIRED_PROFILE_FIELDS.length,
      missingFields: REQUIRED_PROFILE_FIELDS.map((field) => field.label),
      status: "incomplete"
    };
  }

  const missingFields = REQUIRED_PROFILE_FIELDS.filter(
    (field) => !field.isComplete(profile)
  ).map((field) => field.label);
  const totalFields = REQUIRED_PROFILE_FIELDS.length;
  const completedFields = totalFields - missingFields.length;
  const percentage = Math.round((completedFields / totalFields) * 100);

  return {
    percentage,
    completedFields,
    totalFields,
    missingFields,
    status: getDoctorProfileStatus(profile, percentage)
  };
}

export function getDoctorProfileStatus(
  profile: ManagedDoctorProfile,
  completionPercentage = calculateCompletionPercentage(profile)
): DoctorProfileStatus {
  if (completionPercentage < 100) {
    return "incomplete";
  }

  if (profile.verificationStatus === "approved") {
    return "verified";
  }

  if (profile.verificationStatus === "rejected") {
    return "rejected";
  }

  if (profile.verificationStatus === "suspended") {
    return "suspended";
  }

  if (profile.verificationStatus === "needs_review") {
    return "needs_update";
  }

  return "pending_verification";
}

export function formatDoctorProfileStatus(status: DoctorProfileStatus): string {
  if (status === "pending_verification") {
    return "Pending verification";
  }

  if (status === "needs_update") {
    return "Needs update";
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
}

function includesText(value: string | null | undefined, search?: string): boolean {
  if (!search) {
    return true;
  }

  return value?.toLowerCase().includes(search.trim().toLowerCase()) ?? false;
}

export function getNextAvailableDate(doctor: PublicDoctor): string | null {
  return doctor.availableSlots[0]?.startTime ?? null;
}

export function formatConsultationType(type: ConsultationType): string {
  if (type === "in_person") {
    return "In person";
  }

  if (type === "video") {
    return "Video";
  }

  return "Phone";
}

const REQUIRED_PROFILE_FIELDS: Array<{
  label: string;
  isComplete: (profile: ManagedDoctorProfile) => boolean;
}> = [
  { label: "Profile image", isComplete: (profile) => Boolean(profile.profileImageUrl) },
  { label: "Title", isComplete: (profile) => Boolean(profile.title?.trim()) },
  { label: "Full name", isComplete: (profile) => Boolean(profile.fullName.trim()) },
  {
    label: "Registration number",
    isComplete: (profile) => Boolean(profile.registrationNumber.trim())
  },
  {
    label: "Qualifications",
    isComplete: (profile) => profile.qualifications.length > 0
  },
  { label: "Specialties", isComplete: (profile) => profile.specialties.length > 0 },
  {
    label: "Years of experience",
    isComplete: (profile) => profile.yearsOfExperience >= 0
  },
  { label: "Languages", isComplete: (profile) => profile.languages.length > 0 },
  {
    label: "Biography",
    isComplete: (profile) => Boolean(profile.biography?.trim())
  },
  {
    label: "Consultation fee",
    isComplete: (profile) => profile.consultationFee > 0
  },
  { label: "Services", isComplete: (profile) => profile.services.length > 0 },
  {
    label: "Visiting locations",
    isComplete: (profile) => profile.locations.some((location) => location.isActive)
  }
];

function calculateCompletionPercentage(profile: ManagedDoctorProfile): number {
  const completedFields = REQUIRED_PROFILE_FIELDS.filter((field) =>
    field.isComplete(profile)
  ).length;

  return Math.round((completedFields / REQUIRED_PROFILE_FIELDS.length) * 100);
}

function splitCsv(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
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
