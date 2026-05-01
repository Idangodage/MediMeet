import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/Screen";
import { Badge, Button, Card } from "@/components/ui";
import { fontStyles } from "@/constants/fonts";
import { ROUTES } from "@/constants/routes";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { PublicBrandLockup } from "@/features/public/components/PublicBrandLockup";

export function LandingScreen() {
  return (
    <Screen>
      <View style={styles.hero}>
        <PublicBrandLockup />
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>Existing MediMeet features</Text>
        </View>
        <Text style={styles.title}>Private doctor appointments made simple</Text>
        <Text style={styles.subtitle}>
          Verified discovery, scheduling, onboarding, and practice workflows
          are already in place. This screen now presents those same features in
          a cleaner, more app-like public experience.
        </Text>
        <View style={styles.actions}>
          <Link href={ROUTES.onboardingIntro} asChild>
            <Button title="Start onboarding" style={styles.flexButton} />
          </Link>
          <Link href={ROUTES.doctors} asChild>
            <Button
              title="Browse doctors"
              variant="secondary"
              style={styles.flexButton}
            />
          </Link>
        </View>
      </View>

      <BenefitCard
        badge="For patients"
        points={[
          "Search doctors by specialty, location, language, fee, and availability.",
          "Book appointment slots with a clear location, date, and time.",
          "Manage upcoming, previous, cancelled, favourite, and visited doctors."
        ]}
        title="Find care with confidence"
      />

      <BenefitCard
        badge="For doctors"
        points={[
          "Create a polished professional profile and verification workflow.",
          "Manage availability, appointment status, and treated patient lists.",
          "Use subscription-gated SaaS tools to grow a private practice."
        ]}
        title="Run a private practice workspace"
      />

      <BenefitCard
        badge="Trust and privacy"
        points={[
          "Guests can browse public verified doctor profiles only.",
          "Doctors only see patients connected to their appointments or relationships.",
          "Platform admins verify doctors and sensitive actions are audited."
        ]}
        title="Designed around role-based privacy"
      />
    </Screen>
  );
}

function BenefitCard({
  badge,
  points,
  title
}: {
  badge: string;
  points: string[];
  title: string;
}) {
  return (
    <Card>
      <Badge label={badge} variant="primary" />
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={styles.pointList}>
        {points.map((point) => (
          <View key={point} style={styles.pointRow}>
            <View style={styles.pointDot} />
            <Text style={styles.pointText}>{point}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: spacing.lg,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: "#D8E8FF",
    backgroundColor: "#F8FBFF",
    padding: spacing.xl
  },
  heroBadge: {
    alignSelf: "flex-start",
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs
  },
  heroBadgeText: {
    color: colors.primaryDark,
    fontSize: typography.small,
    ...fontStyles.extraBold
  },
  title: {
    color: colors.text,
    fontSize: typography.hero,
    letterSpacing: -1,
    lineHeight: 44,
    ...fontStyles.extraBold
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24,
    ...fontStyles.regular
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  flexButton: {
    minWidth: 180
  },
  cardTitle: {
    color: colors.text,
    fontSize: typography.title,
    letterSpacing: -0.5,
    lineHeight: 36,
    ...fontStyles.extraBold
  },
  pointList: {
    gap: spacing.md
  },
  pointRow: {
    flexDirection: "row",
    gap: spacing.md
  },
  pointDot: {
    width: 10,
    height: 10,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    marginTop: 7
  },
  pointText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24,
    ...fontStyles.regular
  }
});
