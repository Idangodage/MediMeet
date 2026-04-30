import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/Screen";
import { Badge, Button, Card } from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { colors, radius, spacing, typography } from "@/constants/theme";

export function LandingScreen() {
  return (
    <Screen>
      <View style={styles.hero}>
        <Badge label="MediMeet MVP" variant="primary" />
        <Text style={styles.title}>Private Doctor Appointments Made Simple.</Text>
        <Text style={styles.subtitle}>
          A trusted mobile workspace for patients, private practice doctors,
          clinics, and platform admins focused on verified discovery,
          availability, booking, and SaaS practice tools.
        </Text>
        <View style={styles.actions}>
          <Link href={ROUTES.onboardingIntro} asChild>
            <Button title="Start onboarding" />
          </Link>
          <Link href={ROUTES.doctors} asChild>
            <Button title="Browse doctors" variant="secondary" />
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
    borderRadius: 34,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.primaryTint,
    padding: spacing.xl
  },
  title: {
    color: colors.text,
    fontSize: typography.hero,
    fontWeight: "900",
    letterSpacing: -1,
    lineHeight: 44
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  cardTitle: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "900",
    letterSpacing: -0.5,
    lineHeight: 36
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
    backgroundColor: colors.success,
    marginTop: 7
  },
  pointText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24
  }
});
