import { StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/Screen";
import { Avatar, Badge, Button, Card, EmptyState } from "@/components/ui";
import { colors, spacing, typography } from "@/constants/theme";
import { useAuth } from "@/features/auth";

export function DoctorHomeScreen() {
  const { profile, signOut, user } = useAuth();

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.identity}>
          <Avatar name={profile?.fullName ?? user?.email} />
          <View style={styles.identityText}>
            <Text style={styles.eyebrow}>Doctor workspace</Text>
            <Text style={styles.title}>
              {profile?.fullName ?? user?.email ?? "Doctor"}
            </Text>
          </View>
        </View>
        <Badge label="Doctor" />
      </View>

      <Card title="Practice operations" subtitle="Clinical schedule tools will live here.">
        <EmptyState
          title="Doctor tools pending"
          message="The doctor feature boundary is ready for availability, appointment, and patient workflow modules."
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
