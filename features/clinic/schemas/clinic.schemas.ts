import { z } from "zod";

const requiredText = (label: string) =>
  z.string().trim().min(1, `${label} is required.`);

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .refine((value) => !value || /^https?:\/\/.+\..+/.test(value), {
    message: "Enter a valid website URL."
  });

export const clinicProfileSchema = z.object({
  description: z.string().trim().optional(),
  email: z.string().trim().email("Enter a valid clinic email."),
  logoUri: z.string().nullable().optional(),
  name: requiredText("Clinic name"),
  phone: requiredText("Phone").min(7, "Enter a valid phone number."),
  website: optionalUrl
});

export const clinicLocationSchema = z.object({
  address: requiredText("Address"),
  city: requiredText("City"),
  id: z.string().optional(),
  latitude: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || /^-?\d+(\.\d+)?$/.test(value), {
      message: "Enter a valid latitude."
    }),
  longitude: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || /^-?\d+(\.\d+)?$/.test(value), {
      message: "Enter a valid longitude."
    }),
  openingHours: z.string().trim().optional()
});

export const clinicDoctorInviteSchema = z
  .object({
    email: z.string().trim().optional(),
    registrationNumber: z.string().trim().optional()
  })
  .refine((value) => Boolean(value.email || value.registrationNumber), {
    message: "Enter a doctor email or registration number.",
    path: ["email"]
  });

export type ClinicProfileFormValues = z.infer<typeof clinicProfileSchema>;
export type ClinicLocationFormValues = z.infer<typeof clinicLocationSchema>;
export type ClinicDoctorInviteFormValues = z.infer<
  typeof clinicDoctorInviteSchema
>;
