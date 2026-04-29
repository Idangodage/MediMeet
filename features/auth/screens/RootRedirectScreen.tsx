import { Redirect, type Href } from "expo-router";

import { LoadingScreen } from "@/components/LoadingScreen";
import { getHomeRouteForRole } from "@/constants/routes";
import { useAuth } from "@/features/auth/context/AuthProvider";

export function RootRedirectScreen() {
  const { isLoading, role } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return <Redirect href={getHomeRouteForRole(role) as Href} />;
}
