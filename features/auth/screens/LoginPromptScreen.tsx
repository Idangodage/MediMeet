import { Link, Redirect, useLocalSearchParams, type Href } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/Screen";
import { Button, Card } from "@/components/ui";
import { fontStyles } from "@/constants/fonts";
import { ROUTES, getHomeRouteForRole } from "@/constants/routes";
import { colors, spacing, typography } from "@/constants/theme";
import { useAuth } from "@/features/auth";
import { PublicBrandLockup } from "@/features/public/components/PublicBrandLockup";

export function LoginPromptScreen() {
  const { doctorId } = useLocalSearchParams<{ doctorId?: string }>();
  const { role, session } = useAuth();

  if (session && role === "patient" && doctorId) {
    return <Redirect href={`/book-doctor/${doctorId}` as Href} />;
  }

  if (session) {
    return <Redirect href={getHomeRouteForRole(role) as Href} />;
  }

  return (
    <Screen contentStyle={styles.content}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <PublicBrandLockup />
          <View style={styles.accountChip}>
            <Text style={styles.accountChipText}>Account required</Text>
          </View>
          <Text style={styles.title}>Sign in to book this appointment</Text>
          <Text style={styles.subtitle}>
            Guests can view doctor profiles, availability, locations, and
            reviews. Booking requires a patient account so we can protect
            appointment and health-related data.
          </Text>
          <View style={styles.disclaimerBox}>
            <Text style={styles.disclaimerText}>
              This platform is for doctor discovery and appointment booking
              only. It is not for emergency medical care.
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Link href={ROUTES.signIn} asChild>
            <Button title="Sign in" />
          </Link>
          <Link href={`${ROUTES.signUp}?role=patient`} asChild>
            <Button title="Create patient account" variant="secondary" />
          </Link>
          <Link
            href={(doctorId ? `/doctors/${doctorId}` : ROUTES.doctors) as Href}
            asChild
          >
            <Button title="Back to doctor profile" variant="ghost" />
          </Link>
          <View style={styles.legalLinks}>
            <Link href={ROUTES.privacy} asChild>
              <Button title="Privacy" variant="ghost" />
            </Link>
            <Link href={ROUTES.terms} asChild>
              <Button title="Terms" variant="ghost" />
            </Link>
          </View>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: "center"
  },
  card: {
    borderRadius: 32,
    borderColor: "#D8E8FF",
    backgroundColor: "#F9FBFF"
  },
  header: {
    gap: spacing.md
  },
  accountChip: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: colors.warningSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs
  },
  accountChipText: {
    color: colors.warning,
    fontSize: typography.small,
    ...fontStyles.extraBold
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    lineHeight: 34,
    ...fontStyles.extraBold
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24,
    ...fontStyles.regular
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
    lineHeight: 19,
    ...fontStyles.bold
  },
  actions: {
    gap: spacing.md
  },
  legalLinks: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  }
});
