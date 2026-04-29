import { Link, Redirect, useLocalSearchParams, type Href } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/Screen";
import { Badge, Button, Card } from "@/components/ui";
import { ROUTES, getHomeRouteForRole } from "@/constants/routes";
import { colors, spacing, typography } from "@/constants/theme";
import { useAuth } from "@/features/auth";

export function LoginPromptScreen() {
  const { doctorId } = useLocalSearchParams<{ doctorId?: string }>();
  const { role, session } = useAuth();

  if (session) {
    return <Redirect href={getHomeRouteForRole(role) as Href} />;
  }

  return (
    <Screen contentStyle={styles.content}>
      <Card>
        <View style={styles.header}>
          <Badge label="Account required" variant="warning" />
          <Text style={styles.title}>Sign in to book this appointment</Text>
          <Text style={styles.subtitle}>
            Guests can view doctor profiles, availability, locations, and
            reviews. Booking requires a patient account so we can protect
            appointment and health-related data.
          </Text>
        </View>

        <View style={styles.actions}>
          <Link href={ROUTES.signIn} asChild>
            <Button title="Sign in" />
          </Link>
          <Link href={ROUTES.signUp} asChild>
            <Button title="Create patient account" variant="secondary" />
          </Link>
          <Link
            href={(doctorId ? `/doctors/${doctorId}` : ROUTES.doctors) as Href}
            asChild
          >
            <Button title="Back to doctor profile" variant="ghost" />
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
  header: {
    gap: spacing.md
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "900",
    lineHeight: 34
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24
  },
  actions: {
    gap: spacing.md
  }
});
