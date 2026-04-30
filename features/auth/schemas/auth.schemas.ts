import { z } from "zod";

export const signUpRoleSchema = z.enum([
  "patient",
  "doctor",
  "clinic_admin"
]);

export const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required.")
});

export const signUpSchema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your full name."),
    email: z.string().trim().email("Enter a valid email address."),
    phone: z.string().trim().optional(),
    password: z
      .string()
      .min(8, "Use at least 8 characters for your password."),
    confirmPassword: z.string().min(1, "Confirm your password."),
    role: signUpRoleSchema,
    acceptedTerms: z
      .boolean()
      .refine((value) => value, "Accept the terms and privacy policy to continue.")
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"]
  });

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email address.")
});

export type SignInFormValues = z.infer<typeof signInSchema>;
export type SignUpFormValues = z.infer<typeof signUpSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
