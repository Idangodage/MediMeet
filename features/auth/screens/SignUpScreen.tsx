import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/Screen";
import { Button, Card, ErrorState, Input } from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { colors, spacing, typography } from "@/constants/theme";
import { RoleSelection } from "@/features/auth/components/RoleSelection";
import {
  signUpSchema,
  type SignUpFormValues
} from "@/features/auth/schemas/auth.schemas";
import { signUpWithEmail } from "@/services/auth.service";

export function SignUpScreen() {
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      role: "patient"
    }
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    setSuccessMessage(null);

    try {
      const result = await signUpWithEmail(values);

      if (result.needsEmailConfirmation) {
        setSuccessMessage(
          "Account created. Check your email to confirm your account, then sign in."
        );
        return;
      }

      router.replace(ROUTES.onboarding);
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Unable to create your account right now."
      );
    }
  });

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.brand}>MediMeet</Text>
        <Text style={styles.title}>Create your MediMeet account</Text>
        <Text style={styles.subtitle}>
          Choose your role, create credentials, then complete a focused
          onboarding flow for your workspace.
        </Text>
      </View>

      <Card>
        {formError ? <ErrorState message={formError} /> : null}
        {successMessage ? <Text style={styles.success}>{successMessage}</Text> : null}

        <Controller
          control={control}
          name="fullName"
          render={({ field: { onBlur, onChange, value } }) => (
            <Input
              autoCapitalize="words"
              error={errors.fullName?.message}
              label="Full name"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Jane Patient"
              textContentType="name"
              value={value}
            />
          )}
        />

        <RoleSelection control={control} name="role" />

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

        <Controller
          control={control}
          name="password"
          render={({ field: { onBlur, onChange, value } }) => (
            <Input
              autoCapitalize="none"
              error={errors.password?.message}
              label="Password"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="At least 8 characters"
              secureTextEntry
              textContentType="newPassword"
              value={value}
            />
          )}
        />

        <Button title="Create account" isLoading={isSubmitting} onPress={onSubmit} />
      </Card>

      <Text style={styles.footerText}>
        Already have an account?{" "}
        <Link href={ROUTES.signIn} style={styles.link}>
          Sign in
        </Link>
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: "center"
  },
  header: {
    gap: spacing.sm
  },
  brand: {
    color: colors.primary,
    fontSize: typography.subtitle,
    fontWeight: "900"
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "900",
    lineHeight: 34
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24
  },
  success: {
    color: colors.success,
    fontSize: typography.body,
    fontWeight: "700"
  },
  footerText: {
    color: colors.textMuted,
    fontSize: typography.body,
    textAlign: "center"
  },
  link: {
    color: colors.primaryDark,
    fontWeight: "800"
  }
});
