import {
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View
} from "react-native";

import { fontStyles } from "@/constants/fonts";
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
        selectionColor={colors.focus}
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
    ...fontStyles.semiBold
  },
  input: {
    minHeight: 52,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    paddingHorizontal: spacing.lg,
    fontSize: typography.body,
    ...fontStyles.medium
  },
  inputError: {
    borderColor: colors.danger
  },
  helper: {
    color: colors.textMuted,
    fontSize: typography.small,
    ...fontStyles.regular
  },
  error: {
    color: colors.danger,
    fontSize: typography.small,
    ...fontStyles.semiBold
  }
});
