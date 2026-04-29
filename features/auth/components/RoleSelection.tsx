import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "@/constants/theme";
import type { AuthenticatedRole } from "@/types/roles";

type SignUpRole = Exclude<AuthenticatedRole, "platform_admin">;

const roleOptions: Array<{
  role: SignUpRole;
  title: string;
  description: string;
}> = [
  {
    role: "patient",
    title: "Patient",
    description: "Find verified doctors and manage your appointments."
  },
  {
    role: "doctor",
    title: "Doctor",
    description: "Build your profile and prepare your availability."
  },
  {
    role: "clinic_admin",
    title: "Clinic admin",
    description: "Create a clinic workspace and manage doctors."
  }
];

type RoleSelectionProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
};

export function RoleSelection<T extends FieldValues>({
  control,
  name
}: RoleSelectionProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value } }) => (
        <View style={styles.container}>
          <Text style={styles.label}>Choose account type</Text>
          {roleOptions.map((option) => {
            const isSelected = value === option.role;

            return (
              <Pressable
                accessibilityRole="button"
                key={option.role}
                onPress={() => onChange(option.role)}
                style={[
                  styles.option,
                  isSelected ? styles.optionSelected : null
                ]}
              >
                <View style={styles.radio}>
                  {isSelected ? <View style={styles.radioDot} /> : null}
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                  <Text style={styles.optionDescription}>
                    {option.description}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm
  },
  label: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: "800"
  },
  option: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft
  },
  radio: {
    alignItems: "center",
    justifyContent: "center",
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.primary
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary
  },
  optionContent: {
    flex: 1,
    gap: spacing.xs
  },
  optionTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  optionDescription: {
    color: colors.textMuted,
    fontSize: typography.small,
    lineHeight: 18
  }
});
