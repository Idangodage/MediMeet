import { StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/Screen";
import { Badge, Button, Card, EmptyState } from "@/components/ui";
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
        title="SaaS administration foundation"
        subtitle="Subscription, tenant, and support operations belong behind this route."
      >
        <EmptyState
          title="Admin modules pending"
          message="This feature boundary is ready for platform-level tenant, billing, audit, and support tooling."
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
