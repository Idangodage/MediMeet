import { useEffect } from "react";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { ROUTES, getHomeRouteForRole } from "@/constants/routes";
import { colors, spacing, typography } from "@/constants/theme";
import { useAuth } from "@/features/auth/context/AuthProvider";

export function RootRedirectScreen() {
  const { isLoading, isOnboardingComplete, role, session } = useAuth();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!session) {
      router.replace(ROUTES.welcome);
      return;
    }

    if (role !== "platform_admin" && !isOnboardingComplete) {
      router.replace(ROUTES.onboarding);
      return;
    }

    router.replace(getHomeRouteForRole(role));
  }, [isLoading, isOnboardingComplete, role, session]);

  return (
    <View style={styles.container}>
      <View style={styles.logoMark}>
        <Text style={styles.logoText}>M</Text>
      </View>
      <Text style={styles.appName}>MediMeet</Text>
      <Text style={styles.subtitle}>Preparing your secure healthcare workspace...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    gap: spacing.md,
    backgroundColor: colors.background
  },
  logoMark: {
    alignItems: "center",
    justifyContent: "center",
    width: 88,
    height: 88,
    borderRadius: 32,
    backgroundColor: colors.primary
  },
  logoText: {
    color: colors.white,
    fontSize: 44,
    fontWeight: "900"
  },
  appName: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "900",
    letterSpacing: -0.6
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.body,
    fontWeight: "700",
    textAlign: "center"
  }
});
