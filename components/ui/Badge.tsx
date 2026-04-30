import { StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "@/constants/theme";

type BadgeVariant = "neutral" | "primary" | "info" | "success" | "warning" | "danger";

type BadgeProps = {
  label: string;
  variant?: BadgeVariant;
};

export function Badge({ label, variant = "neutral" }: BadgeProps) {
  return (
    <View style={[styles.base, styles[variant]]}>
      <Text style={[styles.text, styles[`${variant}Text`]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: "flex-start",
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs
  },
  neutral: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border
  },
  primary: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primarySoft
  },
  info: {
    backgroundColor: colors.infoSoft,
    borderColor: colors.infoSoft
  },
  success: {
    backgroundColor: colors.successSoft,
    borderColor: colors.successSoft
  },
  warning: {
    backgroundColor: colors.warningSoft,
    borderColor: colors.warningSoft
  },
  danger: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.dangerSoft
  },
  text: {
    fontSize: typography.small,
    fontWeight: "900",
    letterSpacing: 0.1
  },
  neutralText: {
    color: colors.accent
  },
  primaryText: {
    color: colors.primaryDark
  },
  infoText: {
    color: colors.info
  },
  successText: {
    color: colors.success
  },
  warningText: {
    color: colors.warning
  },
  dangerText: {
    color: colors.danger
  }
});
