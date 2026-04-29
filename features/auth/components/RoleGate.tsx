import type { ReactNode } from "react";
import { Redirect, type Href } from "expo-router";

import { LoadingScreen } from "@/components/LoadingScreen";
import { ROUTES, getHomeRouteForRole } from "@/constants/routes";
import { useAuth } from "@/features/auth/context/AuthProvider";
import type { AuthenticatedRole } from "@/types/roles";

type RoleGateProps = {
  allowedRoles: AuthenticatedRole[];
  children: ReactNode;
};

export function RoleGate({ allowedRoles, children }: RoleGateProps) {
  const { isLoading, role, session } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!session) {
    return <Redirect href={ROUTES.signIn as Href} />;
  }

  if (!allowedRoles.includes(role as AuthenticatedRole)) {
    return <Redirect href={getHomeRouteForRole(role) as Href} />;
  }

  return children;
}
