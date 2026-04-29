import type { UserRole } from "@/types/roles";

export const ROUTES = {
  root: "/",
  signIn: "/sign-in",
  signUp: "/sign-up",
  patientHome: "/patient",
  doctorHome: "/doctor",
  clinicHome: "/clinic",
  adminHome: "/admin"
} as const;

export const HOME_ROUTE_BY_ROLE: Record<UserRole, string> = {
  guest: ROUTES.signIn,
  patient: ROUTES.patientHome,
  doctor: ROUTES.doctorHome,
  clinic_admin: ROUTES.clinicHome,
  platform_admin: ROUTES.adminHome
};

export function getHomeRouteForRole(role: UserRole): string {
  return HOME_ROUTE_BY_ROLE[role] ?? ROUTES.signIn;
}
