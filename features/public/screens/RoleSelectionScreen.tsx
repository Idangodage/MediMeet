import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/Screen";
import { Badge, Button, Card } from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { colors, spacing, typography } from "@/constants/theme";
import type { AuthenticatedRole } from "@/types/roles";

type SelectableRole = Exclude<AuthenticatedRole, "platform_admin">;

const roles: Array<{
  description: string;
  label: string;
  role: SelectableRole;
}> = [
  {
    role: "patient",
    label: "I am a Patient",
    description: "Search doctors, book appointments, and manage your visits."
  },
  {
    role: "doctor",
    label: "I am a Doctor",
    description: "Create your professional profile, manage availability, and receive bookings."
  },
  {
    role: "clinic_admin",
    label: "I manage a Clinic",
    description: "Manage multiple doctors, clinic locations, and appointments."
  }
];

export function PublicRoleSelectionScreen() {
  return (
    <Screen>
      <View style={styles.header}>
        <Badge label="Choose your workspace" variant="primary" />
        <Text style={styles.title}>How will you use MediMeet?</Text>
        <Text style={styles.subtitle}>
          Select your role so signup can take you into the right onboarding
          flow and dashboard.
        </Text>
      </View>

      {roles.map((item) => (
        <Card key={item.role}>
          <Text style={styles.roleTitle}>{item.label}</Text>
          <Text style={styles.roleDescription}>{item.description}</Text>
          <Link href={`${ROUTES.signUp}?role=${item.role}` as const} asChild>
            <Button title="Continue" />
          </Link>
        </Card>
      ))}

      <Card title="Not ready to create an account?">
        <View style={styles.actions}>
          <Link href={ROUTES.doctors} asChild>
            <Button title="Continue as Guest" variant="secondary" />
          </Link>
          <Link href={ROUTES.signIn} asChild>
            <Button title="Login instead" variant="ghost" />
          </Link>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.md,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.primaryTint,
    padding: spacing.xl
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
  roleTitle: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: "900"
  },
  roleDescription: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24
  },
  actions: {
    gap: spacing.md
  }
});
