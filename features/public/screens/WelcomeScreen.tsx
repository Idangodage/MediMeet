import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/Screen";
import { Button } from "@/components/ui";
import { fontStyles } from "@/constants/fonts";
import { ROUTES } from "@/constants/routes";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { PublicBrandLockup } from "@/features/public/components/PublicBrandLockup";
import { PublicHeroArtwork } from "@/features/public/components/PublicHeroArtwork";

export function WelcomeScreen() {
  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.hero}>
        <PublicBrandLockup centered />
        <Text style={styles.title}>
          {"Find trusted doctors and\nmanage appointments easily"}
        </Text>
        <Text style={styles.subtitle}>
          Book appointments, consult with specialists, and take charge of your
          health.
        </Text>

        <View style={styles.featurePills}>
          <View style={styles.featurePill}>
            <Text style={styles.featurePillText}>Verified doctors</Text>
          </View>
          <View style={styles.featurePill}>
            <Text style={styles.featurePillText}>Private booking</Text>
          </View>
          <View style={styles.featurePill}>
            <Text style={styles.featurePillText}>Role-based care tools</Text>
          </View>
        </View>

        <PublicHeroArtwork />

        <View style={styles.actions}>
          <Link href={ROUTES.landing} asChild>
            <Button title="Get Started" />
          </Link>
          <Link href={ROUTES.signIn} asChild>
            <Button title="Log In" variant="secondary" />
          </Link>
        </View>

        <Link href={ROUTES.doctors} style={styles.guestLink}>
          Continue as guest.
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: "center",
    paddingBottom: spacing.lg
  },
  hero: {
    gap: spacing.md
  },
  title: {
    width: "100%",
    maxWidth: 360,
    alignSelf: "center",
    color: colors.text,
    fontSize: 28,
    letterSpacing: -1,
    lineHeight: 34,
    textAlign: "center",
    ...fontStyles.extraBold
  },
  subtitle: {
    maxWidth: 460,
    alignSelf: "center",
    color: colors.textMuted,
    fontSize: 17,
    lineHeight: 25,
    textAlign: "center",
    ...fontStyles.regular
  },
  featurePills: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  featurePill: {
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: "#D7E8FF",
    backgroundColor: "#F6FAFF",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  featurePillText: {
    color: "#31558C",
    fontSize: typography.small,
    ...fontStyles.bold
  },
  actions: {
    gap: spacing.sm
  },
  guestLink: {
    alignSelf: "center",
    color: colors.primaryDark,
    fontSize: typography.body,
    textAlign: "center",
    textDecorationLine: "underline",
    ...fontStyles.semiBold
  }
});
