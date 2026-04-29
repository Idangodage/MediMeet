import { z } from "zod";

const requiredText = (label: string) =>
  z.string().trim().min(1, `${label} is required.`);

const numericString = (label: string) =>
  z
    .string()
    .trim()
    .regex(/^\d+$/, `Enter a valid ${label.toLowerCase()}.`);

const moneyString = (label: string) =>
  z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, `Enter a valid ${label.toLowerCase()}.`);

export const doctorProfileSchema = z.object({
  fullName: requiredText("Full name").min(2, "Enter your full name."),
  title: requiredText("Title"),
  registrationNumber: requiredText("Registration number"),
  qualifications: requiredText("Qualifications"),
  specialties: requiredText("Specialties"),
  subspecialties: z.string().trim(),
  yearsOfExperience: numericString("years of experience"),
  languages: requiredText("Languages"),
  consultationFee: moneyString("consultation fee"),
  biography: requiredText("Biography").min(
    40,
    "Write at least 40 characters for your biography."
  ),
  services: requiredText("Services"),
  profilePhotoUri: z.string().nullable().optional()
});

export const doctorLocationSchema = z.object({
  id: z.string().optional(),
  name: requiredText("Location name"),
  address: requiredText("Address"),
  city: requiredText("City"),
  isActive: z.boolean()
});

export type DoctorProfileFormValues = z.infer<typeof doctorProfileSchema>;
export type DoctorLocationFormValues = z.infer<typeof doctorLocationSchema>;
