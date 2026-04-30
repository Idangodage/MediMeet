import { z } from "zod";

export const bookingSchema = z.object({
  reasonForVisit: z
    .string()
    .trim()
    .max(500, "Keep the reason under 500 characters.")
    .optional()
});

export type BookingFormValues = z.infer<typeof bookingSchema>;
