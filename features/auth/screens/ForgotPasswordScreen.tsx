import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/Screen";
import { Button } from "@/components/ui";
import { fontStyles } from "@/constants/fonts";
import { ROUTES } from "@/constants/routes";
import { colors, spacing, typography } from "@/constants/theme";
import { AuthBackButton } from "@/features/auth/components/AuthBackButton";
import { AuthGlyph } from "@/features/auth/components/AuthGlyph";
import { AuthTextField } from "@/features/auth/components/AuthTextField";
import { ForgotPasswordArtwork } from "@/features/auth/components/ForgotPasswordArtwork";
import { PublicBrandLockup } from "@/features/public/components/PublicBrandLockup";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues
} from "@/features/auth/schemas/auth.schemas";
import { sendPasswordResetEmail } from "@/services/auth.service";

export function ForgotPasswordScreen() {
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: ""
    }
  });

  const onSubmit = handleSubmit(async ({ email }) => {
    setFormError(null);
    setSuccessMessage(null);

    try {
      await sendPasswordResetEmail(email);
      setSuccessMessage("If this email exists, a password reset link has been sent.");
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Unable to send reset email."
      );
    }
  });

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.topRow}>
        <AuthBackButton onPress={() => router.back()} />
      </View>

      <View style={styles.header}>
        <PublicBrandLockup centered />
        <Text style={styles.title}>Reset your password</Text>
        <Text style={styles.subtitle}>
          Enter your email address and we'll send you a reset link.
        </Text>
      </View>

      <ForgotPasswordArtwork />

      {formError ? <Text style={styles.errorText}>{formError}</Text> : null}
      {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

      <View style={styles.form}>
        <Controller
          control={control}
          name="email"
          render={({ field: { onBlur, onChange, value } }) => (
            <AuthTextField
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              error={errors.email?.message}
              keyboardType="email-address"
              label="Email Address"
              leftIcon="mail"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Enter your email address"
              textContentType="emailAddress"
              value={value}
            />
          )}
        />

        <Button
          title="Send Reset Link"
          isLoading={isSubmitting}
          leftIcon={
            <View style={styles.buttonIconCircle}>
              <AuthGlyph name="send" color={colors.primary} />
            </View>
          }
          onPress={onSubmit}
          style={styles.primaryButton}
        />
      </View>

      <View style={styles.supportRow}>
        <View style={styles.supportIconCircle}>
          <Text style={styles.supportIcon}>?</Text>
        </View>
        <View style={styles.supportTextWrap}>
          <Text style={styles.supportTitle}>Need help?</Text>
          <Link href={ROUTES.signIn} style={styles.supportLink}>
            Contact Support {">"}
          </Link>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xl
  },
  topRow: {
    alignItems: "flex-start"
  },
  header: {
    alignItems: "center",
    gap: spacing.md
  },
  title: {
    color: colors.text,
    fontSize: 34,
    lineHeight: 40,
    textAlign: "center",
    ...fontStyles.extraBold
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 18,
    lineHeight: 28,
    textAlign: "center",
    ...fontStyles.regular
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.small,
    ...fontStyles.semiBold
  },
  successText: {
    color: colors.success,
    fontSize: typography.body,
    ...fontStyles.bold
  },
  form: {
    gap: spacing.lg
  },
  primaryButton: {
    minHeight: 78
  },
  buttonIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center"
  },
  supportRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    paddingTop: spacing.sm
  },
  supportIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#EEF4FF",
    alignItems: "center",
    justifyContent: "center"
  },
  supportIcon: {
    color: "#2D73E1",
    fontSize: 34,
    lineHeight: 34,
    ...fontStyles.bold
  },
  supportTextWrap: {
    gap: spacing.xs
  },
  supportTitle: {
    color: "#0F2C66",
    fontSize: 18,
    ...fontStyles.bold
  },
  supportLink: {
    color: "#2D73E1",
    fontSize: 18,
    ...fontStyles.medium
  }
});
