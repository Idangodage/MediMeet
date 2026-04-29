import { getSupabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

const VERIFICATION_BUCKET = "doctor-verification-documents";

export type VerificationDocumentType =
  Database["public"]["Enums"]["verification_document_type"];
export type VerificationStatus =
  Database["public"]["Enums"]["verification_status"];
type VerificationDocumentRow =
  Database["public"]["Tables"]["doctor_verification_documents"]["Row"];

export type VerificationDocumentAsset = {
  uri: string;
  name: string;
  mimeType?: string | null;
  size?: number | null;
};

export type VerificationDocumentRequirement = {
  type: VerificationDocumentType;
  label: string;
  required: boolean;
  description: string;
};

export type DoctorVerificationDocument = {
  id: string;
  doctorId: string;
  documentType: VerificationDocumentType;
  fileName: string | null;
  mimeType: string | null;
  fileSize: number | null;
  storagePath: string;
  status: VerificationStatus;
  verificationNote: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
};

export type VerificationDoctorProfile = {
  id: string;
  userId: string;
  fullName: string;
  title: string | null;
  profileImageUrl: string | null;
  registrationNumber: string;
  qualifications: string[];
  specialties: string[];
  subspecialties: string[];
  services: string[];
  yearsOfExperience: number;
  languages: string[];
  biography: string | null;
  consultationFee: number;
  verificationStatus: VerificationStatus;
  isPublic: boolean;
  averageRating: number;
  createdAt: string;
  updatedAt: string;
  email?: string | null;
};

export type DoctorVerificationSummary = {
  doctor: VerificationDoctorProfile;
  documents: DoctorVerificationDocument[];
  requiredDocumentCount: number;
  uploadedRequiredDocumentCount: number;
};

export type DoctorVerificationRequest = DoctorVerificationSummary;

export const VERIFICATION_DOCUMENT_REQUIREMENTS: VerificationDocumentRequirement[] = [
  {
    type: "medical_registration_certificate",
    label: "Medical registration certificate",
    required: true,
    description: "Valid medical council or licensing registration."
  },
  {
    type: "qualification_certificate",
    label: "Qualification certificate",
    required: true,
    description: "Degree, board, or specialist qualification evidence."
  },
  {
    type: "identity_document",
    label: "Identity document",
    required: true,
    description: "Passport, national ID, or equivalent identity proof."
  },
  {
    type: "clinic_proof",
    label: "Clinic proof",
    required: false,
    description: "Optional clinic ownership, employment, or location proof."
  }
];

export async function getOwnDoctorVerification(): Promise<DoctorVerificationSummary> {
  const supabase = getSupabase();
  const doctor = await getOwnVerificationDoctorProfile();
  const documents = await loadVerificationDocuments([doctor.id]);

  return buildVerificationSummary(doctor, documents);
}

export async function uploadDoctorVerificationDocument({
  asset,
  documentType
}: {
  asset: VerificationDocumentAsset;
  documentType: VerificationDocumentType;
}): Promise<void> {
  const supabase = getSupabase();
  const doctor = await getOwnVerificationDoctorProfile();
  const safeFileName = sanitizeFileName(asset.name);
  const storagePath = `${doctor.id}/${documentType}-${Date.now()}-${safeFileName}`;
  const response = await fetch(asset.uri);
  const arrayBuffer = await response.arrayBuffer();
  const contentType = asset.mimeType ?? guessMimeType(asset.name);

  const { error: uploadError } = await supabase.storage
    .from(VERIFICATION_BUCKET)
    .upload(storagePath, arrayBuffer, {
      contentType,
      upsert: false
    });

  if (uploadError) {
    throw uploadError;
  }

  const { error } = await supabase.from("doctor_verification_documents").insert({
    doctor_id: doctor.id,
    document_type: documentType,
    file_url: storagePath,
    storage_path: storagePath,
    file_name: asset.name,
    mime_type: contentType,
    file_size: asset.size ?? null,
    status: "pending",
    verification_note: null
  });

  if (error) {
    throw error;
  }
}

export async function listPendingDoctorVerificationRequests(): Promise<
  DoctorVerificationRequest[]
> {
  const supabase = getSupabase();
  const [{ data: pendingDoctors, error: doctorError }, { data: pendingDocs, error: docError }] =
    await Promise.all([
      supabase
        .from("doctor_profiles")
        .select(
          "id, user_id, full_name, title, profile_image_url, registration_number, qualifications, specialties, subspecialties, services, years_of_experience, languages, biography, consultation_fee, verification_status, is_public, average_rating, created_at, updated_at"
        )
        .in("verification_status", ["pending", "needs_review"])
        .order("updated_at", { ascending: false }),
      supabase
        .from("doctor_verification_documents")
        .select("*")
        .in("status", ["pending", "needs_review"])
        .order("created_at", { ascending: false })
    ]);

  if (doctorError) {
    throw doctorError;
  }

  if (docError) {
    throw docError;
  }

  const doctorIds = new Set((pendingDoctors ?? []).map((doctor) => doctor.id));
  for (const document of pendingDocs ?? []) {
    doctorIds.add(document.doctor_id);
  }

  if (doctorIds.size === 0) {
    return [];
  }

  const { data: allDoctors, error: allDoctorsError } = await supabase
    .from("doctor_profiles")
    .select(
      "id, user_id, full_name, title, profile_image_url, registration_number, qualifications, specialties, subspecialties, services, years_of_experience, languages, biography, consultation_fee, verification_status, is_public, average_rating, created_at, updated_at"
    )
    .in("id", Array.from(doctorIds))
    .order("updated_at", { ascending: false });

  if (allDoctorsError) {
    throw allDoctorsError;
  }

  const doctors = await hydrateDoctorEmails((allDoctors ?? []).map(mapDoctorProfile));
  const documents = await loadVerificationDocuments(Array.from(doctorIds));

  return doctors.map((doctor) => buildVerificationSummary(doctor, documents));
}

export async function getAdminDoctorVerificationRequest(
  doctorId: string
): Promise<DoctorVerificationRequest | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("doctor_profiles")
    .select(
      "id, user_id, full_name, title, profile_image_url, registration_number, qualifications, specialties, subspecialties, services, years_of_experience, languages, biography, consultation_fee, verification_status, is_public, average_rating, created_at, updated_at"
    )
    .eq("id", doctorId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const [doctor] = await hydrateDoctorEmails([mapDoctorProfile(data)]);
  const documents = await loadVerificationDocuments([doctorId]);

  return buildVerificationSummary(doctor, documents);
}

export async function reviewDoctorVerificationRequest({
  doctorId,
  note,
  status
}: {
  doctorId: string;
  note: string;
  status: VerificationStatus;
}): Promise<void> {
  const supabase = getSupabase();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("You must be signed in as a platform admin.");
  }

  const reviewedAt = new Date().toISOString();
  const { error: documentError } = await supabase
    .from("doctor_verification_documents")
    .update({
      status,
      verification_note: note.trim() || null,
      reviewed_by: user.id,
      reviewed_at: reviewedAt
    })
    .eq("doctor_id", doctorId);

  if (documentError) {
    throw documentError;
  }

  const { error: doctorError } = await supabase
    .from("doctor_profiles")
    .update({
      verification_status: status
    })
    .eq("id", doctorId);

  if (doctorError) {
    throw doctorError;
  }
}

export async function createVerificationDocumentSignedUrl(
  storagePath: string
): Promise<string> {
  const supabase = getSupabase();
  const { data, error } = await supabase.storage
    .from(VERIFICATION_BUCKET)
    .createSignedUrl(storagePath, 300);

  if (error) {
    throw error;
  }

  return data.signedUrl;
}

export function getLatestDocumentByType(
  documents: DoctorVerificationDocument[],
  documentType: VerificationDocumentType
): DoctorVerificationDocument | null {
  return (
    documents
      .filter((document) => document.documentType === documentType)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0] ?? null
  );
}

export function formatVerificationDocumentType(
  documentType: VerificationDocumentType
): string {
  const legacyLabels: Partial<Record<VerificationDocumentType, string>> = {
    medical_license: "Medical license",
    board_certificate: "Board certificate",
    identity_document: "Identity document",
    insurance: "Insurance",
    other: "Other document"
  };

  return (
    VERIFICATION_DOCUMENT_REQUIREMENTS.find((item) => item.type === documentType)
      ?.label ??
    legacyLabels[documentType] ??
    "Verification document"
  );
}

export function formatVerificationStatus(status: VerificationStatus): string {
  if (status === "needs_review") {
    return "Needs update";
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
}

async function getOwnVerificationDoctorProfile(): Promise<VerificationDoctorProfile> {
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
    .select(
      "id, user_id, full_name, title, profile_image_url, registration_number, qualifications, specialties, subspecialties, services, years_of_experience, languages, biography, consultation_fee, verification_status, is_public, average_rating, created_at, updated_at"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Complete doctor onboarding before uploading verification documents.");
  }

  return {
    ...mapDoctorProfile(data),
    email: user.email ?? null
  };
}

async function loadVerificationDocuments(
  doctorIds: string[]
): Promise<DoctorVerificationDocument[]> {
  if (doctorIds.length === 0) {
    return [];
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("doctor_verification_documents")
    .select("*")
    .in("doctor_id", doctorIds)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapVerificationDocument);
}

async function hydrateDoctorEmails(
  doctors: VerificationDoctorProfile[]
): Promise<VerificationDoctorProfile[]> {
  if (doctors.length === 0) {
    return [];
  }

  const supabase = getSupabase();
  const userIds = doctors.map((doctor) => doctor.userId);
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email")
    .in("id", userIds);

  if (error) {
    throw error;
  }

  return doctors.map((doctor) => ({
    ...doctor,
    email: data?.find((profile) => profile.id === doctor.userId)?.email ?? null
  }));
}

function buildVerificationSummary(
  doctor: VerificationDoctorProfile,
  documents: DoctorVerificationDocument[]
): DoctorVerificationSummary {
  const doctorDocuments = documents.filter(
    (document) => document.doctorId === doctor.id
  );
  const requiredDocuments = VERIFICATION_DOCUMENT_REQUIREMENTS.filter(
    (document) => document.required
  );
  const uploadedRequiredDocumentCount = requiredDocuments.filter((requirement) =>
    doctorDocuments.some((document) => document.documentType === requirement.type)
  ).length;

  return {
    doctor,
    documents: doctorDocuments,
    requiredDocumentCount: requiredDocuments.length,
    uploadedRequiredDocumentCount
  };
}

function mapDoctorProfile(row: {
  id: string;
  user_id: string;
  full_name: string;
  title: string | null;
  profile_image_url: string | null;
  registration_number: string;
  qualifications: string[];
  specialties: string[];
  subspecialties: string[];
  services: string[];
  years_of_experience: number;
  languages: string[];
  biography: string | null;
  consultation_fee: number;
  verification_status: VerificationStatus;
  is_public: boolean;
  average_rating: number;
  created_at: string;
  updated_at: string;
}): VerificationDoctorProfile {
  return {
    id: row.id,
    userId: row.user_id,
    fullName: row.full_name,
    title: row.title,
    profileImageUrl: row.profile_image_url,
    registrationNumber: row.registration_number,
    qualifications: row.qualifications,
    specialties: row.specialties,
    subspecialties: row.subspecialties,
    services: row.services,
    yearsOfExperience: row.years_of_experience,
    languages: row.languages,
    biography: row.biography,
    consultationFee: Number(row.consultation_fee),
    verificationStatus: row.verification_status,
    isPublic: row.is_public,
    averageRating: Number(row.average_rating),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapVerificationDocument(
  row: VerificationDocumentRow
): DoctorVerificationDocument {
  return {
    id: row.id,
    doctorId: row.doctor_id,
    documentType: row.document_type,
    fileName: row.file_name,
    mimeType: row.mime_type,
    fileSize: row.file_size,
    storagePath: row.storage_path,
    status: row.status,
    verificationNote: row.verification_note,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    createdAt: row.created_at
  };
}

function sanitizeFileName(fileName: string): string {
  return fileName
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 90);
}

function guessMimeType(fileName: string): string {
  const extension = fileName.split(".").pop()?.toLowerCase();

  if (extension === "png") {
    return "image/png";
  }

  if (extension === "webp") {
    return "image/webp";
  }

  if (extension === "pdf") {
    return "application/pdf";
  }

  return "image/jpeg";
}
