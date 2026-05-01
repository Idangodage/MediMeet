import type { ReactNode } from "react";
import { StyleSheet, Text, View, type ViewProps } from "react-native";

import { fontStyles } from "@/constants/fonts";
import { colors, radius, shadows, spacing, typography } from "@/constants/theme";

type CardProps = ViewProps & {
  title?: string;
  subtitle?: string;
  footer?: ReactNode;
  children?: ReactNode;
};

export function Card({ title, subtitle, footer, children, style, ...props }: CardProps) {
  return (
    <View style={[styles.card, style]} {...props}>
      {title || subtitle ? (
        <View style={styles.header}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      ) : null}
      {children}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    padding: spacing.lg,
    ...shadows.card
  },
  header: {
    gap: spacing.xs
  },
  title: {
    color: colors.text,
    fontSize: typography.subtitle,
    letterSpacing: -0.2,
    ...fontStyles.extraBold
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.small,
    lineHeight: 20,
    ...fontStyles.medium
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.lg
  }
});
