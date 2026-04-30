import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/Screen";
import { Badge, Button, Card } from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { colors, radius, spacing, typography } from "@/constants/theme";

export function WelcomeScreen() {
  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.logoMark}>
          <Text style={styles.logoText}>M</Text>
        </View>
        <Badge label="Private healthcare appointments" variant="primary" />
        <Text style={styles.title}>
          Find Trusted Doctors. Book Private Appointments Easily.
        </Text>
        <Text style={styles.subtitle}>
          Connect with verified private practice doctors, check availability,
          and book appointments with confidence.
        </Text>
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerText}>
            This platform is for doctor discovery and appointment booking only.
            It is not for emergency medical care.
          </Text>
        </View>
      </View>

      <Card>
        <View style={styles.actions}>
          <Link href={ROUTES.landing} asChild>
            <Button title="Get Started" />
          </Link>
          <Link href={ROUTES.doctors} asChild>
            <Button title="Continue as Guest" variant="secondary" />
          </Link>
          <Link href={ROUTES.signIn} asChild>
            <Button title="I already have an account" variant="ghost" />
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
  hero: {
    gap: spacing.lg,
    borderRadius: 34,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.primaryTint,
    padding: spacing.xl
  },
  logoMark: {
    alignItems: "center",
    justifyContent: "center",
    width: 68,
    height: 68,
    borderRadius: radius.lg,
    backgroundColor: colors.primary
  },
  logoText: {
    color: colors.white,
    fontSize: 34,
    fontWeight: "900"
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
  actions: {
    gap: spacing.md
  }
});
