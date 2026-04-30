import { z } from "zod";

const requiredText = (label: string) =>
  z.string().trim().min(1, `${label} is required.`);

export const patientProfileSettingsSchema = z.object({
  fullName: requiredText("Full name").min(2, "Enter your full name."),
  email: z.string().trim().email("Enter a valid email address."),
  phone: requiredText("Phone").min(7, "Enter a valid phone number."),
  dateOfBirth: z
    .string()
    .trim()
    .regex(/^$|^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD or leave blank."),
  city: requiredText("City"),
  preferredLanguage: requiredText("Preferred language").min(
    2,
    "Enter a language code or language name."
  )
});

export type PatientProfileSettingsFormValues = z.infer<
  typeof patientProfileSettingsSchema
>;
