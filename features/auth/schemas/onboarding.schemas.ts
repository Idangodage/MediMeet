import { z } from "zod";

const requiredText = (label: string) =>
  z.string().trim().min(1, `${label} is required.`);

export const patientOnboardingSchema = z.object({
  fullName: requiredText("Full name").min(2, "Enter your full name."),
  phone: requiredText("Phone").min(7, "Enter a valid phone number."),
  city: requiredText("City"),
  preferredLanguage: requiredText("Preferred language").min(
    2,
    "Enter a language code or language name."
  ),
  dateOfBirth: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD.")
    .or(z.literal(""))
    .optional()
});

export const doctorOnboardingSchema = z.object({
  fullName: requiredText("Full name").min(2, "Enter your full name."),
  title: requiredText("Title"),
  registrationNumber: requiredText("Registration number"),
  qualifications: requiredText("Qualifications"),
  specialty: requiredText("Specialty"),
  subspecialty: z.string().trim().optional(),
  yearsOfExperience: z
    .string()
    .trim()
    .regex(/^\d+$/, "Enter whole years of experience."),
  languages: requiredText("Languages"),
  consultationFee: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid consultation fee."),
  services: requiredText("Services offered"),
  biography: requiredText("Biography").min(
    40,
    "Write at least 40 characters for your biography."
  ),
  visitingLocationName: requiredText("Visiting location"),
  visitingAddress: requiredText("Visiting address"),
  visitingCity: requiredText("Visiting city"),
  firstAvailableDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD."),
  startTime: z.string().trim().regex(/^\d{2}:\d{2}$/, "Use HH:MM."),
  endTime: z.string().trim().regex(/^\d{2}:\d{2}$/, "Use HH:MM."),
  appointmentDurationMinutes: z
    .string()
    .trim()
    .regex(/^\d+$/, "Enter duration in minutes."),
  profilePhotoUri: z.string().nullable().optional()
});

export const clinicAdminOnboardingSchema = z.object({
  clinicName: requiredText("Clinic name"),
  clinicEmail: z.string().trim().email("Enter a valid clinic email."),
  clinicPhone: requiredText("Clinic phone").min(7, "Enter a valid phone number."),
  website: z.string().trim().url("Enter a valid website URL.").or(z.literal("")).optional(),
  clinicAddress: requiredText("Clinic address"),
  city: requiredText("City"),
  clinicLocation: requiredText("Clinic location")
});

export type PatientOnboardingFormValues = z.infer<
  typeof patientOnboardingSchema
>;
export type DoctorOnboardingFormValues = z.infer<
  typeof doctorOnboardingSchema
>;
export type ClinicAdminOnboardingFormValues = z.infer<
  typeof clinicAdminOnboardingSchema
>;
