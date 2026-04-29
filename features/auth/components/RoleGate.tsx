import type { ReactNode } from "react";
import { Redirect, type Href } from "expo-router";

import { LoadingScreen } from "@/components/LoadingScreen";
import { ROUTES, getHomeRouteForRole } from "@/constants/routes";
import { useAuth } from "@/features/auth/context/AuthProvider";
import type { AuthenticatedRole } from "@/types/roles";

type RoleGateProps = {
  allowedRoles: AuthenticatedRole[];
  requireOnboarding?: boolean;
  children: ReactNode;
};

export function RoleGate({
  allowedRoles,
  requireOnboarding = true,
  children
}: RoleGateProps) {
  const { isLoading, isOnboardingComplete, role, session } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!session) {
    return <Redirect href={ROUTES.signIn as Href} />;
  }

  if (!allowedRoles.includes(role as AuthenticatedRole)) {
    return <Redirect href={getHomeRouteForRole(role) as Href} />;
  }

  if (
    requireOnboarding &&
    role !== "platform_admin" &&
    !isOnboardingComplete
  ) {
    return <Redirect href={ROUTES.onboarding as Href} />;
  }

  return children;
}
