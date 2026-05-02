import { Link, Redirect, router, useLocalSearchParams, type Href } from "expo-router";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { Screen } from "@/components/Screen";
import { Button } from "@/components/ui";
import { fontStyles } from "@/constants/fonts";
import { ROUTES } from "@/constants/routes";
import { colors, radius, spacing } from "@/constants/theme";
import { PublicBrandLockup } from "@/features/public/components/PublicBrandLockup";
import { PublicRoleIntroArtwork } from "@/features/public/components/PublicRoleIntroArtwork";
import { normalizeRole, type AuthenticatedRole } from "@/types/roles";

type IntroRole = Exclude<AuthenticatedRole, "platform_admin">;

type IntroConfig = {
  actionLabel: string;
  description: string;
  subtitle: string;
  title: string;
};

const ROLE_ORDER: IntroRole[] = ["patient", "doctor", "clinic_admin"];

const INTRO_CONTENT: Record<IntroRole, IntroConfig> = {
  patient: {
    title: "Find trusted doctors\nnear you",
    subtitle:
      "Search by specialty, location, language, availability, and consultation fee.",
    description: "Create Patient Account",
    actionLabel: "Create Patient Account"
  },
  doctor: {
    title: "Present your private\npractice professionally",
    subtitle:
      "Create a verified profile with your qualifications, specialties, services, and visiting locations.",
    description: "Create Doctor Account",
    actionLabel: "Create Doctor Account"
  },
  clinic_admin: {
    title: "Run your clinic\nefficiently",
    subtitle:
      "Manage locations, doctors, schedules, and appointments from one professional dashboard.",
    description: "Create Clinic Account",
    actionLabel: "Create Clinic Account"
  }
};

export function RoleAccountIntroScreen() {
  const { width } = useWindowDimensions();
  const { role: roleParam } = useLocalSearchParams<{ role?: string }>();
  const normalizedRole = normalizeRole(roleParam);
  const isTablet = width >= 768;
  const isCompact = width < 380;

  if (
    !normalizedRole ||
    normalizedRole === "platform_admin"
  ) {
    return <Redirect href={ROUTES.roleSelection as Href} />;
  }

  const role = normalizedRole as IntroRole;
  const config = INTRO_CONTENT[role];
  const activeIndex = ROLE_ORDER.indexOf(role);

  return (
    <Screen contentStyle={styles.content}>
      <View style={[styles.hero, isTablet ? styles.heroTablet : null]}>
        <PublicBrandLockup centered />
        <View style={styles.stepPill}>
          <Text style={styles.stepPillText}>1 of 3</Text>
        </View>
        <Text
          style={[
            styles.title,
            isCompact ? styles.titleCompact : null,
            isTablet ? styles.titleTablet : null
          ]}
        >
          {config.title}
        </Text>
        <Text
          style={[
            styles.subtitle,
            isCompact ? styles.subtitleCompact : null,
            isTablet ? styles.subtitleTablet : null
          ]}
        >
          {config.subtitle}
        </Text>
      </View>

      <PublicRoleIntroArtwork role={role} />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {ROLE_ORDER.map((item, index) => (
            <View
              key={item}
              style={[styles.dot, index === activeIndex && styles.activeDot]}
            />
          ))}
        </View>

        <Button
          title={config.actionLabel}
          onPress={() => router.push(`${ROUTES.signUp}?role=${role}` as const)}
        />

        <Link href={ROUTES.signIn} style={styles.loginLink}>
          Log In
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingBottom: spacing.lg
  },
  hero: {
    alignItems: "center",
    gap: spacing.sm
  },
  heroTablet: {
    alignSelf: "center",
    maxWidth: 720
  },
  stepPill: {
    borderRadius: radius.full,
    backgroundColor: "#EDF4FF",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm
  },
  stepPillText: {
    color: "#496AA1",
    fontSize: 18,
    ...fontStyles.bold
  },
  title: {
    color: colors.text,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -1,
    textAlign: "center",
    ...fontStyles.extraBold
  },
  titleCompact: {
    fontSize: 28,
    lineHeight: 34
  },
  titleTablet: {
    fontSize: 36,
    lineHeight: 42
  },
  subtitle: {
    maxWidth: 640,
    color: colors.textMuted,
    fontSize: 17,
    lineHeight: 24,
    textAlign: "center",
    ...fontStyles.regular
  },
  subtitleCompact: {
    fontSize: 16,
    lineHeight: 22
  },
  subtitleTablet: {
    maxWidth: 700,
    fontSize: 18,
    lineHeight: 26
  },
  footer: {
    marginTop: "auto",
    gap: spacing.md
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.md
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#D5E1F3"
  },
  activeDot: {
    backgroundColor: colors.primary
  },
  loginLink: {
    color: "#2D73E1",
    fontSize: 18,
    textAlign: "center",
    ...fontStyles.bold
  }
});
