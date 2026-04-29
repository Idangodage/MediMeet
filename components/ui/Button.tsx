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

import { colors, radius, spacing, typography } from "@/constants/theme";

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
        <ActivityIndicator color={variant === "primary" ? colors.white : colors.primary} />
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
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg
  },
  primary: {
    backgroundColor: colors.primary
  },
  secondary: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.border
  },
  ghost: {
    backgroundColor: "transparent"
  },
  danger: {
    backgroundColor: colors.danger
  },
  disabled: {
    opacity: 0.55
  },
  pressed: {
    transform: [{ scale: 0.99 }]
  },
  text: {
    fontSize: typography.body,
    fontWeight: "700"
  },
  textOnDark: {
    color: colors.white
  },
  textOnLight: {
    color: colors.primaryDark
  }
});
