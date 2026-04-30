import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/Screen";
import { Badge, Button, Card } from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { colors, spacing, typography } from "@/constants/theme";

export function GuestHomeScreen() {
  return (
    <Screen>
      <View style={styles.hero}>
        <Badge label="Private healthcare booking" variant="primary" />
        <Text style={styles.title}>Private-practice care, easier to find</Text>
        <Text style={styles.subtitle}>
          Browse verified doctors by specialty, city, language, fee, consultation
          type, and availability before creating an account.
        </Text>
        <View style={styles.trustRow}>
          <TrustPill label="Verified doctors" />
          <TrustPill label="Private appointment data" />
          <TrustPill label="Secure role-based access" />
        </View>
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerText}>
            This platform is for doctor discovery and appointment booking only.
            It is not for emergency medical care.
          </Text>
        </View>
        <View style={styles.actions}>
          <Link href={ROUTES.doctors} asChild>
            <Button title="Search doctors" />
          </Link>
          <Link href={ROUTES.signUp} asChild>
            <Button title="Create account" variant="secondary" />
          </Link>
        </View>
      </View>

      <View style={styles.metricGrid}>
        <Card style={styles.metricCard}>
          <Text style={styles.metricValue}>24/7</Text>
          <Text style={styles.metricLabel}>Public discovery</Text>
        </Card>
        <Card style={styles.metricCard}>
          <Text style={styles.metricValue}>RLS</Text>
          <Text style={styles.metricLabel}>Privacy enforced</Text>
        </Card>
      </View>

      <Card title="How MediMeet works">
        <View style={styles.step}>
          <Text style={styles.stepNumber}>01</Text>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Search verified doctors</Text>
            <Text style={styles.stepText}>
              Filter by specialty, location, language, availability, consultation
              type, and fee range.
            </Text>
          </View>
        </View>
        <View style={styles.step}>
          <Text style={styles.stepNumber}>02</Text>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Review public profiles</Text>
            <Text style={styles.stepText}>
              Compare credentials, experience, languages, locations, reviews,
              and upcoming availability.
            </Text>
          </View>
        </View>
        <View style={styles.step}>
          <Text style={styles.stepNumber}>03</Text>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Sign in to book</Text>
            <Text style={styles.stepText}>
              Guests can browse freely. Booking requires a patient account so
              appointment records stay private.
            </Text>
          </View>
        </View>
      </Card>

      <Card title="Legal and safety">
        <Text style={styles.stepText}>
          Review MediMeet privacy, terms, and safety limitations before testing
          or deploying the MVP.
        </Text>
        <View style={styles.actions}>
          <Link href={ROUTES.privacy} asChild>
            <Button title="Privacy policy" variant="secondary" />
          </Link>
          <Link href={ROUTES.terms} asChild>
            <Button title="Terms" variant="secondary" />
          </Link>
        </View>
      </Card>
    </Screen>
  );
}

function TrustPill({ label }: { label: string }) {
  return (
    <View style={styles.trustPill}>
      <Text style={styles.trustDot}>•</Text>
      <Text style={styles.trustText}>{label}</Text>
    </View>
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
  trustRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  trustPill: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  trustDot: {
    color: colors.success,
    fontSize: typography.body,
    fontWeight: "900"
  },
  trustText: {
    color: colors.accent,
    fontSize: typography.small,
    fontWeight: "800"
  },
  disclaimerBox: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.warningSoft,
    backgroundColor: colors.warningSoft,
    padding: spacing.md
  },
  disclaimerText: {
    color: colors.warning,
    fontSize: typography.small,
    fontWeight: "800",
    lineHeight: 19
  },
  metricGrid: {
    flexDirection: "row",
    gap: spacing.md
  },
  metricCard: {
    flex: 1,
    gap: spacing.xs,
    paddingVertical: spacing.lg
  },
  metricValue: {
    color: colors.primaryDark,
    fontSize: typography.title,
    fontWeight: "900"
  },
  metricLabel: {
    color: colors.textMuted,
    fontSize: typography.small,
    fontWeight: "800"
  },
  step: {
    flexDirection: "row",
    gap: spacing.md
  },
  stepNumber: {
    color: colors.primary,
    fontSize: typography.subtitle,
    fontWeight: "900"
  },
  stepContent: {
    flex: 1,
    gap: spacing.xs
  },
  stepTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  stepText: {
    color: colors.textMuted,
    fontSize: typography.small,
    lineHeight: 19
  }
});
