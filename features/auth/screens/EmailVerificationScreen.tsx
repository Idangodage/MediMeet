import { Link, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/Screen";
import { Badge, Button, Card } from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { colors, spacing, typography } from "@/constants/theme";

export function EmailVerificationScreen() {
  const { email } = useLocalSearchParams<{ email?: string }>();

  return (
    <Screen contentStyle={styles.content}>
      <Card>
        <Badge label="Verify your email" variant="success" />
        <Text style={styles.title}>Check your inbox</Text>
        <Text style={styles.subtitle}>
          We created your MediMeet account
          {email ? ` for ${email}` : ""}. Confirm your email, then sign in to
          continue role-based onboarding.
        </Text>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            If you do not see the message, check spam or request another signup
            confirmation from Supabase Auth settings.
          </Text>
        </View>
        <View style={styles.actions}>
          <Link href={ROUTES.signIn} asChild>
            <Button title="Go to login" />
          </Link>
          <Link href={ROUTES.welcome} asChild>
            <Button title="Back to welcome" variant="ghost" />
          </Link>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: "center"
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "900",
    letterSpacing: -0.5,
    lineHeight: 36
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24
  },
  infoBox: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.primaryTint,
    padding: spacing.md
  },
  infoText: {
    color: colors.textMuted,
    fontSize: typography.small,
    fontWeight: "700",
    lineHeight: 19
  },
  actions: {
    gap: spacing.md
  }
});
