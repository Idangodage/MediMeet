import type { UserRole } from "@/types/roles";

export const ROUTES = {
  root: "/",
  guestHome: "/guest",
  doctors: "/doctors",
  loginPrompt: "/login-prompt",
  onboarding: "/onboarding",
  signIn: "/sign-in",
  signUp: "/sign-up",
  patientHome: "/patient",
  doctorHome: "/doctor",
  doctorProfile: "/doctor/profile",
  doctorProfilePreview: "/doctor/preview",
  doctorVerification: "/doctor/verification",
  clinicHome: "/clinic",
  adminHome: "/admin",
  adminVerifications: "/admin/verifications"
} as const;

export const HOME_ROUTE_BY_ROLE: Record<UserRole, string> = {
  guest: ROUTES.guestHome,
  patient: ROUTES.patientHome,
  doctor: ROUTES.doctorHome,
  clinic_admin: ROUTES.clinicHome,
  platform_admin: ROUTES.adminHome
};

export function getHomeRouteForRole(role: UserRole): string {
  return HOME_ROUTE_BY_ROLE[role] ?? ROUTES.signIn;
}
