import {
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View
} from "react-native";

import { colors, radius, spacing, typography } from "@/constants/theme";

type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  helperText?: string;
};

export function Input({ label, error, helperText, style, ...props }: InputProps) {
  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[styles.input, error ? styles.inputError : null, style]}
        {...props}
      />
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.helper}>{helperText}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs
  },
  label: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: "700"
  },
  input: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    paddingHorizontal: spacing.lg,
    fontSize: typography.body
  },
  inputError: {
    borderColor: colors.danger
  },
  helper: {
    color: colors.textMuted,
    fontSize: typography.small
  },
  error: {
    color: colors.danger,
    fontSize: typography.small,
    fontWeight: "600"
  }
});
