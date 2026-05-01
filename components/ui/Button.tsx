import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle
} from "react-native";

import { fontStyles } from "@/constants/fonts";
import { colors, radius, shadows, spacing, typography } from "@/constants/theme";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = PressableProps & {
  title: string;
  variant?: ButtonVariant;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  title,
  variant = "primary",
  isLoading = false,
  disabled,
  leftIcon,
  style,
  ...pressableProps
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: isLoading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style
      ]}
      {...pressableProps}
    >
      {isLoading ? (
        <ActivityIndicator
          color={variant === "primary" || variant === "danger" ? colors.white : colors.primary}
        />
      ) : (
        <>
          {leftIcon}
          <Text
            style={[
              styles.text,
              variant === "primary" || variant === "danger"
                ? styles.textOnDark
                : styles.textOnLight
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: "transparent"
  },
  primary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...shadows.soft
  },
  secondary: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong
  },
  ghost: {
    backgroundColor: "transparent",
    borderColor: "transparent"
  },
  danger: {
    backgroundColor: colors.danger,
    borderColor: colors.danger
  },
  disabled: {
    opacity: 0.55,
    shadowOpacity: 0,
    elevation: 0
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }]
  },
  text: {
    fontSize: typography.body,
    letterSpacing: -0.1,
    ...fontStyles.bold
  },
  textOnDark: {
    color: colors.white
  },
  textOnLight: {
    color: colors.primaryDark
  }
});
