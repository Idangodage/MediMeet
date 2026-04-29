import { StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/Screen";
import { Badge, Button, Card, EmptyState } from "@/components/ui";
import { colors, spacing, typography } from "@/constants/theme";
import { useAuth } from "@/features/auth";

export function ClinicDashboardScreen() {
  const { signOut } = useAuth();

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Clinic admin</Text>
        <Text style={styles.title}>Clinic workspace</Text>
        <Badge label="Clinic Admin" variant="warning" />
      </View>

      <Card
        title="Clinic management foundation"
        subtitle="Multi-doctor clinic workflows can be composed inside this feature area."
      >
        <EmptyState
          title="Clinic tools pending"
          message="This boundary is prepared for staff, doctors, locations, and operating-hour modules."
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
