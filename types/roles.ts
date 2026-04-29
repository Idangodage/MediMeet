export const AUTHENTICATED_ROLES = [
  "patient",
  "doctor",
  "clinic_admin",
  "platform_admin"
] as const;

export const USER_ROLES = ["guest", ...AUTHENTICATED_ROLES] as const;

export type AuthenticatedRole = (typeof AUTHENTICATED_ROLES)[number];
export type UserRole = (typeof USER_ROLES)[number];

export function isAuthenticatedRole(role: unknown): role is AuthenticatedRole {
  return (
    typeof role === "string" &&
    AUTHENTICATED_ROLES.includes(role as AuthenticatedRole)
  );
}

export function normalizeRole(role: unknown): AuthenticatedRole | null {
  return isAuthenticatedRole(role) ? role : null;
}
