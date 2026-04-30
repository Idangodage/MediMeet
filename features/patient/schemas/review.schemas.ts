import { z } from "zod";

export const appointmentReviewSchema = z.object({
  rating: z.coerce
    .number()
    .int("Rating must be a whole number.")
    .min(1, "Choose a rating from 1 to 5.")
    .max(5, "Choose a rating from 1 to 5."),
  comment: z
    .string()
    .trim()
    .max(1000, "Keep the review under 1000 characters.")
    .optional(),
  isPublic: z.boolean()
});

export type AppointmentReviewFormValues = z.infer<
  typeof appointmentReviewSchema
>;
export type AppointmentReviewFormInput = z.input<
  typeof appointmentReviewSchema
>;
