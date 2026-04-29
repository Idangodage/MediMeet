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
        <Badge label="MediMeet discovery" variant="success" />
        <Text style={styles.title}>Private-practice care, easier to find</Text>
        <Text style={styles.subtitle}>
          Browse verified doctors by specialty, city, language, fee, consultation
          type, and availability before creating an account.
        </Text>
        <View style={styles.actions}>
          <Link href={ROUTES.doctors} asChild>
            <Button title="Search doctors" />
          </Link>
          <Link href={ROUTES.signUp} asChild>
            <Button title="Create account" variant="secondary" />
          </Link>
        </View>
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: spacing.lg,
    borderRadius: 32,
    backgroundColor: colors.primarySoft,
    padding: spacing.xl
  },
  title: {
    color: colors.text,
    fontSize: 36,
    fontWeight: "900",
    lineHeight: 42
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
