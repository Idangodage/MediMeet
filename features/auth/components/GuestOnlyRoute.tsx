import type { ReactNode } from "react";
import { Redirect, type Href } from "expo-router";

import { LoadingScreen } from "@/components/LoadingScreen";
import { getHomeRouteForRole } from "@/constants/routes";
import { useAuth } from "@/features/auth/context/AuthProvider";

type GuestOnlyRouteProps = {
  children: ReactNode;
};

export function GuestOnlyRoute({ children }: GuestOnlyRouteProps) {
  const { isLoading, role, session } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (session) {
    return <Redirect href={getHomeRouteForRole(role) as Href} />;
  }

  return children;
}
