import { Redirect, type Href } from "expo-router";

import { LoadingScreen } from "@/components/LoadingScreen";
import { ROUTES, getHomeRouteForRole } from "@/constants/routes";
import { useAuth } from "@/features/auth/context/AuthProvider";

export function RootRedirectScreen() {
  const { isLoading, isOnboardingComplete, role, session } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (session && role !== "platform_admin" && !isOnboardingComplete) {
    return <Redirect href={ROUTES.onboarding as Href} />;
  }

  return <Redirect href={getHomeRouteForRole(role) as Href} />;
}
