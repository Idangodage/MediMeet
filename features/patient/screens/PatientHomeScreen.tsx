import { StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/Screen";
import { Avatar, Badge, Button, Card, EmptyState } from "@/components/ui";
import { colors, spacing, typography } from "@/constants/theme";
import { useAuth } from "@/features/auth";

export function PatientHomeScreen() {
  const { profile, signOut, user } = useAuth();

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.identity}>
          <Avatar
            imageUrl={profile?.avatarUrl}
            name={profile?.fullName ?? user?.email}
          />
          <View style={styles.identityText}>
            <Text style={styles.eyebrow}>Patient portal</Text>
            <Text style={styles.title}>
              {profile?.fullName ?? user?.email ?? "Patient"}
            </Text>
          </View>
        </View>
        <Badge label="Patient" variant="success" />
      </View>

      <Card
        title="Appointments foundation"
        subtitle="Booking flows are intentionally not implemented in this architecture pass."
      >
        <EmptyState
          title="No booking UI yet"
          message="This screen is reserved for the patient appointment experience once the booking domain is added."
        />
      </Card>

      <Button title="Sign out" variant="ghost" onPress={signOut} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.lg
  },
  identity: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md
  },
  identityText: {
    flex: 1
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
