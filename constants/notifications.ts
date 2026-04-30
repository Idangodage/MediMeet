import type { AuthenticatedRole } from "@/types/roles";

export const NOTIFICATION_EVENTS = {
  patientAppointmentBooked: "patient_appointment_booked",
  patientAppointmentConfirmed: "patient_appointment_confirmed",
  patientAppointmentCancelled: "patient_appointment_cancelled",
  patientAppointmentRescheduled: "patient_appointment_rescheduled",
  patientAppointmentReminder: "patient_appointment_reminder",
  patientReviewRequest: "patient_review_request",
  doctorNewAppointmentBooking: "doctor_new_appointment_booking",
  doctorAppointmentCancelledByPatient: "doctor_appointment_cancelled_by_patient",
  doctorAppointmentReminder: "doctor_appointment_reminder",
  doctorVerificationApproved: "doctor_verification_approved",
  doctorVerificationRejected: "doctor_verification_rejected",
  doctorSubscriptionPaymentFailed: "doctor_subscription_payment_failed",
  doctorSubscriptionRenewalReminder: "doctor_subscription_renewal_reminder",
  clinicNewClinicAppointment: "clinic_new_clinic_appointment",
  clinicDoctorAddedToClinic: "clinic_doctor_added_to_clinic",
  clinicSubscriptionWarning: "clinic_subscription_warning",
  adminNewDoctorVerificationRequest: "admin_new_doctor_verification_request",
  adminReportedProfile: "admin_reported_profile",
  adminFailedPaymentEvent: "admin_failed_payment_event"
} as const;

export type NotificationEvent =
  (typeof NOTIFICATION_EVENTS)[keyof typeof NOTIFICATION_EVENTS];

export type NotificationCategory =
  | "appointment"
  | "payment"
  | "subscription"
  | "system"
  | "verification";

export type NotificationDefinition = {
  event: NotificationEvent;
  category: NotificationCategory;
  audience: AuthenticatedRole;
  label: string;
};

export const NOTIFICATION_DEFINITIONS: Record<
  NotificationEvent,
  NotificationDefinition
> = {
  patient_appointment_booked: {
    event: NOTIFICATION_EVENTS.patientAppointmentBooked,
    category: "appointment",
    audience: "patient",
    label: "Appointment booked"
  },
  patient_appointment_confirmed: {
    event: NOTIFICATION_EVENTS.patientAppointmentConfirmed,
    category: "appointment",
    audience: "patient",
    label: "Appointment confirmed"
  },
  patient_appointment_cancelled: {
    event: NOTIFICATION_EVENTS.patientAppointmentCancelled,
    category: "appointment",
    audience: "patient",
    label: "Appointment cancelled"
  },
  patient_appointment_rescheduled: {
    event: NOTIFICATION_EVENTS.patientAppointmentRescheduled,
    category: "appointment",
    audience: "patient",
    label: "Appointment rescheduled"
  },
  patient_appointment_reminder: {
    event: NOTIFICATION_EVENTS.patientAppointmentReminder,
    category: "appointment",
    audience: "patient",
    label: "Appointment reminder"
  },
  patient_review_request: {
    event: NOTIFICATION_EVENTS.patientReviewRequest,
    category: "appointment",
    audience: "patient",
    label: "Review request"
  },
  doctor_new_appointment_booking: {
    event: NOTIFICATION_EVENTS.doctorNewAppointmentBooking,
    category: "appointment",
    audience: "doctor",
    label: "New appointment booking"
  },
  doctor_appointment_cancelled_by_patient: {
    event: NOTIFICATION_EVENTS.doctorAppointmentCancelledByPatient,
    category: "appointment",
    audience: "doctor",
    label: "Appointment cancelled by patient"
  },
  doctor_appointment_reminder: {
    event: NOTIFICATION_EVENTS.doctorAppointmentReminder,
    category: "appointment",
    audience: "doctor",
    label: "Appointment reminder"
  },
  doctor_verification_approved: {
    event: NOTIFICATION_EVENTS.doctorVerificationApproved,
    category: "verification",
    audience: "doctor",
    label: "Verification approved"
  },
  doctor_verification_rejected: {
    event: NOTIFICATION_EVENTS.doctorVerificationRejected,
    category: "verification",
    audience: "doctor",
    label: "Verification rejected"
  },
  doctor_subscription_payment_failed: {
    event: NOTIFICATION_EVENTS.doctorSubscriptionPaymentFailed,
    category: "payment",
    audience: "doctor",
    label: "Subscription payment failed"
  },
  doctor_subscription_renewal_reminder: {
    event: NOTIFICATION_EVENTS.doctorSubscriptionRenewalReminder,
    category: "subscription",
    audience: "doctor",
    label: "Subscription renewal reminder"
  },
  clinic_new_clinic_appointment: {
    event: NOTIFICATION_EVENTS.clinicNewClinicAppointment,
    category: "appointment",
    audience: "clinic_admin",
    label: "New clinic appointment"
  },
  clinic_doctor_added_to_clinic: {
    event: NOTIFICATION_EVENTS.clinicDoctorAddedToClinic,
    category: "system",
    audience: "clinic_admin",
    label: "Doctor added to clinic"
  },
  clinic_subscription_warning: {
    event: NOTIFICATION_EVENTS.clinicSubscriptionWarning,
    category: "subscription",
    audience: "clinic_admin",
    label: "Clinic subscription warning"
  },
  admin_new_doctor_verification_request: {
    event: NOTIFICATION_EVENTS.adminNewDoctorVerificationRequest,
    category: "verification",
    audience: "platform_admin",
    label: "New doctor verification request"
  },
  admin_reported_profile: {
    event: NOTIFICATION_EVENTS.adminReportedProfile,
    category: "system",
    audience: "platform_admin",
    label: "Reported profile"
  },
  admin_failed_payment_event: {
    event: NOTIFICATION_EVENTS.adminFailedPaymentEvent,
    category: "payment",
    audience: "platform_admin",
    label: "Failed payment event"
  }
};

export const PUSH_NOTIFICATION_CHANNELS = {
  appointments: "appointments",
  verification: "verification",
  billing: "billing",
  system: "system"
} as const;
