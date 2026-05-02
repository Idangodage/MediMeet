import { useState } from "react";
import { Link, router } from "expo-router";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { Screen } from "@/components/Screen";
import { Button } from "@/components/ui";
import { fontStyles } from "@/constants/fonts";
import { ROUTES } from "@/constants/routes";
import { colors, spacing, typography } from "@/constants/theme";
import { PublicBrandLockup } from "@/features/public/components/PublicBrandLockup";
import { PublicRoleIllustration } from "@/features/public/components/PublicRoleIllustration";
import type { AuthenticatedRole } from "@/types/roles";

type SelectableRole = Exclude<AuthenticatedRole, "platform_admin">;

const roles: Array<{
  description: string;
  label: string;
  role: SelectableRole;
}> = [
  {
    role: "patient",
    label: "Patient",
    description:
      "Find trusted doctors, check availability, and book appointments."
  },
  {
    role: "doctor",
    label: "Doctor",
    description:
      "Create your professional profile, manage availability, and receive bookings."
  },
  {
    role: "clinic_admin",
    label: "Clinic Admin",
    description:
      "Manage your clinic, locations, doctors, and appointments."
  }
];

export function PublicRoleSelectionScreen() {
  const { width } = useWindowDimensions();
  const [selectedRole, setSelectedRole] = useState<SelectableRole>("patient");
  const isTablet = width >= 768;
  const isCompact = width < 380;

  const handleContinue = () => {
    router.push(`/role-intro/${selectedRole}` as const);
  };

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.headerRow}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            pressed ? styles.backButtonPressed : null
          ]}
        >
          <Text style={styles.backButtonText}>{"<"}</Text>
        </Pressable>
      </View>

      <View style={[styles.hero, isTablet ? styles.heroTablet : null]}>
        <PublicBrandLockup centered />
        <Text
          style={[
            styles.title,
            isCompact ? styles.titleCompact : null,
            isTablet ? styles.titleTablet : null
          ]}
        >
          Choose your role
        </Text>
        <Text style={[styles.subtitle, isTablet ? styles.subtitleTablet : null]}>
          Select how you want to use MediMeet
        </Text>
      </View>

      <View style={[styles.roleList, isTablet ? styles.roleListTablet : null]}>
        {roles.map((item) => {
          const isSelected = selectedRole === item.role;

          return (
            <Pressable
              accessibilityRole="button"
              key={item.role}
              onPress={() => setSelectedRole(item.role)}
              style={({ pressed }) => [
                styles.roleCard,
                isCompact ? styles.roleCardCompact : null,
                isTablet ? styles.roleCardTablet : null,
                isSelected ? styles.roleCardSelected : null,
                pressed ? styles.roleCardPressed : null
              ]}
            >
              <PublicRoleIllustration role={item.role} />

              <View style={styles.roleContent}>
                <Text style={styles.roleTitle}>{item.label}</Text>
                <Text style={styles.roleDescription}>{item.description}</Text>
              </View>

              <View style={styles.roleAside}>
                {isSelected ? (
                  <View style={styles.checkBadge}>
                    <View style={styles.checkMarkWrap}>
                      <View style={styles.checkMarkShort} />
                      <View style={styles.checkMarkLong} />
                    </View>
                  </View>
                ) : (
                  <View style={styles.checkBadgeSpacer} />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      <Button title="Continue" onPress={handleContinue} />

      <Text style={styles.footerText}>
        Already have an account?{" "}
        <Link href={ROUTES.signIn} style={styles.loginLink}>
          Log In
        </Link>
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xl
  },
  headerRow: {
    alignItems: "flex-start"
  },
  backButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 64,
    height: 64,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#D6E8FF",
    backgroundColor: colors.surface
  },
  backButtonPressed: {
    opacity: 0.86
  },
  backButtonText: {
    color: "#17316B",
    fontSize: 32,
    lineHeight: 32,
    ...fontStyles.medium
  },
  hero: {
    alignItems: "center",
    gap: spacing.md
  },
  heroTablet: {
    alignSelf: "center",
    maxWidth: 760
  },
  title: {
    color: colors.text,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -1.1,
    textAlign: "center",
    ...fontStyles.extraBold
  },
  titleCompact: {
    fontSize: 30,
    lineHeight: 36
  },
  titleTablet: {
    fontSize: 38,
    lineHeight: 44
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 17,
    lineHeight: 24,
    textAlign: "center",
    ...fontStyles.regular
  },
  subtitleTablet: {
    fontSize: 18,
    lineHeight: 26
  },
  roleList: {
    gap: spacing.lg
  },
  roleListTablet: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 860
  },
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#E4ECF8",
    backgroundColor: colors.surface,
    padding: spacing.lg
  },
  roleCardCompact: {
    gap: spacing.md,
    padding: spacing.md
  },
  roleCardTablet: {
    minHeight: 180,
    paddingHorizontal: spacing.xl
  },
  roleCardSelected: {
    borderColor: colors.primary,
    shadowColor: "rgba(8, 124, 137, 0.18)",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 4
  },
  roleCardPressed: {
    opacity: 0.94
  },
  roleContent: {
    flex: 1,
    gap: spacing.sm
  },
  roleTitle: {
    color: "#112B67",
    fontSize: 28,
    lineHeight: 32,
    ...fontStyles.extraBold
  },
  roleDescription: {
    color: "#6579A6",
    fontSize: 15,
    lineHeight: 22,
    ...fontStyles.regular
  },
  roleAside: {
    alignItems: "center",
    justifyContent: "flex-start",
    alignSelf: "stretch",
    paddingVertical: spacing.xs
  },
  checkBadge: {
    alignItems: "center",
    justifyContent: "center",
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary
  },
  checkMarkWrap: {
    width: 20,
    height: 16,
    position: "relative"
  },
  checkMarkShort: {
    position: "absolute",
    left: 1,
    bottom: 3,
    width: 8,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.white,
    transform: [{ rotate: "45deg" }]
  },
  checkMarkLong: {
    position: "absolute",
    left: 6,
    bottom: 5,
    width: 14,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.white,
    transform: [{ rotate: "-45deg" }]
  },
  checkBadgeSpacer: {
    width: 48,
    height: 48
  },
  footerText: {
    color: colors.textMuted,
    fontSize: typography.body,
    textAlign: "center",
    ...fontStyles.regular
  },
  loginLink: {
    color: "#2D73E1",
    ...fontStyles.bold
  }
});
