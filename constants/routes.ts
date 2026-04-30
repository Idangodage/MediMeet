import type { UserRole } from "@/types/roles";

export const ROUTES = {
  root: "/",
  welcome: "/welcome",
  landing: "/landing",
  onboardingIntro: "/onboarding-intro",
  roleSelection: "/choose-role",
  guestHome: "/guest",
  doctors: "/doctors",
  bookDoctor: "/book-doctor",
  loginPrompt: "/login-prompt",
  privacy: "/privacy",
  terms: "/terms",
  onboarding: "/onboarding",
  signIn: "/sign-in",
  signUp: "/sign-up",
  forgotPassword: "/forgot-password",
  emailVerification: "/email-verification",
  notifications: "/notifications",
  patientHome: "/patient",
  patientAppointments: "/patient/appointments",
  patientVisitedDoctors: "/patient/visited-doctors",
  patientFavouriteDoctors: "/patient/favourite-doctors",
  patientProfile: "/patient/profile",
  doctorHome: "/doctor",
  doctorAppointments: "/doctor/appointments",
  doctorPatients: "/doctor/patients",
  doctorAvailability: "/doctor/availability",
  doctorBilling: "/doctor/billing",
  doctorProfile: "/doctor/profile",
  doctorProfilePreview: "/doctor/preview",
  doctorVerification: "/doctor/verification",
  clinicHome: "/clinic",
  clinicBilling: "/clinic/billing",
  clinicProfile: "/clinic/profile",
  clinicDoctors: "/clinic/doctors",
  clinicAppointments: "/clinic/appointments",
  clinicAnalytics: "/clinic/analytics",
  adminHome: "/admin",
  adminUsers: "/admin/users",
  adminBilling: "/admin/billing",
  adminVerifications: "/admin/verifications",
  adminReviews: "/admin/reviews",
  adminReports: "/admin/reports",
  adminAuditLogs: "/admin/audit-logs"
} as const;

export const HOME_ROUTE_BY_ROLE: Record<UserRole, string> = {
  guest: ROUTES.welcome,
  patient: ROUTES.patientHome,
  doctor: ROUTES.doctorHome,
  clinic_admin: ROUTES.clinicHome,
  platform_admin: ROUTES.adminHome
};

export function getHomeRouteForRole(role: UserRole): string {
  return HOME_ROUTE_BY_ROLE[role] ?? ROUTES.signIn;
}
