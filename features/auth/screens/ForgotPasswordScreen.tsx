import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/Screen";
import { Badge, Button, Card, ErrorState, Input } from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { colors, spacing, typography } from "@/constants/theme";
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
      <Card>
        <Badge label="Account recovery" variant="primary" />
        <Text style={styles.title}>Forgot password?</Text>
        <Text style={styles.subtitle}>
          Enter your email and we will send a secure reset link if the account
          exists.
        </Text>
        {formError ? <ErrorState message={formError} /> : null}
        {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}
        <Controller
          control={control}
          name="email"
          render={({ field: { onBlur, onChange, value } }) => (
            <Input
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              error={errors.email?.message}
              keyboardType="email-address"
              label="Email"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="you@example.com"
              textContentType="emailAddress"
              value={value}
            />
          )}
        />
        <Button title="Send reset link" isLoading={isSubmitting} onPress={onSubmit} />
        <Link href={ROUTES.signIn} asChild>
          <Button title="Back to login" variant="ghost" />
        </Link>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: "center"
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
  successText: {
    color: colors.success,
    fontSize: typography.body,
    fontWeight: "800"
  }
});
