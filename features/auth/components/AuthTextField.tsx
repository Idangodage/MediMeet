import type { ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps
} from "react-native";

import { fontStyles } from "@/constants/fonts";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { AuthGlyph } from "@/features/auth/components/AuthGlyph";

type AuthTextFieldProps = TextInputProps & {
  error?: string;
  label?: string;
  leftIcon: Parameters<typeof AuthGlyph>[0]["name"];
  leftAdornment?: ReactNode;
  onRightIconPress?: () => void;
  rightIcon?: Parameters<typeof AuthGlyph>[0]["name"];
  rightAdornment?: ReactNode;
};

export function AuthTextField({
  error,
  label,
  leftAdornment,
  leftIcon,
  onRightIconPress,
  rightAdornment,
  rightIcon,
  style,
  ...props
}: AuthTextFieldProps) {
  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.fieldShell, error ? styles.fieldShellError : null]}>
        <View style={styles.leftIconWrap}>
          {leftAdornment ?? <AuthGlyph name={leftIcon} />}
        </View>
        <View style={styles.verticalLine} />
        <TextInput
          placeholderTextColor="#8093BC"
          selectionColor={colors.focus}
          style={[styles.input, style]}
          {...props}
        />
        {rightIcon ? (
          <Pressable
            accessibilityRole={onRightIconPress ? "button" : undefined}
            disabled={!onRightIconPress}
            onPress={onRightIconPress}
            style={styles.rightIconWrap}
          >
            {rightAdornment ?? <AuthGlyph name={rightIcon} />}
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm
  },
  label: {
    color: "#0F2C66",
    fontSize: 18,
    ...fontStyles.bold
  },
  fieldShell: {
    minHeight: 72,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#D7E4FA",
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md
  },
  fieldShellError: {
    borderColor: colors.danger
  },
  leftIconWrap: {
    width: 44,
    alignItems: "center",
    justifyContent: "center"
  },
  verticalLine: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: "#E3EAF8",
    marginVertical: spacing.md
  },
  input: {
    flex: 1,
    minHeight: 70,
    color: "#243F73",
    fontSize: 18,
    paddingHorizontal: spacing.md,
    ...fontStyles.medium
  },
  rightIconWrap: {
    width: 44,
    alignItems: "center",
    justifyContent: "center"
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.small,
    ...fontStyles.semiBold
  }
});
