import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/Screen";
import { Badge, Button, Card, EmptyState } from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { colors, spacing, typography } from "@/constants/theme";
import { useAuth } from "@/features/auth";

export function AdminDashboardScreen() {
  const { signOut } = useAuth();

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Platform admin</Text>
        <Text style={styles.title}>MediMeet operations</Text>
        <Badge label="Platform Admin" variant="danger" />
      </View>

      <Card
        title="Doctor verification"
        subtitle="Review pending credentials and private verification documents."
      >
        <Button
          title="Open verification queue"
          onPress={() => router.push(ROUTES.adminVerifications)}
        />
      </Card>

      <Card
        title="SaaS administration foundation"
        subtitle="Subscription, tenant, and support operations belong behind this route."
      >
        <EmptyState
          title="More admin modules pending"
          message="Billing, audit, reporting, and support tooling will be added behind this route."
        />
      </Card>

      <Button title="Sign out" variant="ghost" onPress={signOut} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.md
  },
  eyebrow: {
    color: colors.primary,
    fontSize: typography.small,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "900"
  }
});
