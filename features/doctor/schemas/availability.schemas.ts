import { z } from "zod";

const requiredText = (label: string) =>
  z.string().trim().min(1, `${label} is required.`);

const wholeNumber = (label: string) =>
  z
    .string()
    .trim()
    .regex(/^\d+$/, `Enter a valid ${label.toLowerCase()}.`);

export const availabilitySchema = z.object({
  locationId: requiredText("Location"),
  date: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD."),
  startTime: z.string().trim().regex(/^\d{2}:\d{2}$/, "Use HH:mm."),
  endTime: z.string().trim().regex(/^\d{2}:\d{2}$/, "Use HH:mm."),
  appointmentDurationMinutes: wholeNumber("appointment duration"),
  breakMinutes: wholeNumber("break time"),
  maxPatients: wholeNumber("maximum patients"),
  consultationType: z.enum(["in_person", "video", "phone"]),
  isActive: z.boolean()
});

export type AvailabilityFormValues = z.infer<typeof availabilitySchema>;
