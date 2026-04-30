import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, router, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/Screen";
import { Badge, Button, Card, ErrorState, Input } from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { colors, spacing, typography } from "@/constants/theme";
import { RoleSelection } from "@/features/auth/components/RoleSelection";
import {
  signUpSchema,
  type SignUpFormValues
} from "@/features/auth/schemas/auth.schemas";
import { signUpWithEmail } from "@/services/auth.service";
import { normalizeRole } from "@/types/roles";

export function SignUpScreen() {
  const { role: roleParam } = useLocalSearchParams<{ role?: string }>();
  const initialRole = normalizeRole(roleParam) ?? "patient";
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      role: initialRole === "platform_admin" ? "patient" : initialRole,
      acceptedTerms: false
    }
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      const result = await signUpWithEmail(values);

      if (result.needsEmailConfirmation) {
        router.replace({
          pathname: ROUTES.emailVerification,
          params: { email: values.email }
        });
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
        <Badge label="Secure signup" variant="primary" />

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
          name="phone"
          render={({ field: { onBlur, onChange, value } }) => (
            <Input
              autoComplete="tel"
              error={errors.phone?.message}
              keyboardType="phone-pad"
              label="Phone optional"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="+358 40 000 0000"
              textContentType="telephoneNumber"
              value={value ?? ""}
            />
          )}
        />

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

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onBlur, onChange, value } }) => (
            <Input
              autoCapitalize="none"
              error={errors.confirmPassword?.message}
              label="Confirm password"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Repeat your password"
              secureTextEntry
              textContentType="newPassword"
              value={value}
            />
          )}
        />

        <Controller
          control={control}
          name="acceptedTerms"
          render={({ field: { onChange, value } }) => (
            <View style={styles.agreementBox}>
              <Button
                title={value ? "Terms accepted" : "Accept terms and privacy"}
                variant={value ? "secondary" : "ghost"}
                onPress={() => onChange(!value)}
              />
              <Text style={styles.agreementText}>
                I agree to the{" "}
                <Link href={ROUTES.terms} style={styles.link}>
                  Terms
                </Link>{" "}
                and{" "}
                <Link href={ROUTES.privacy} style={styles.link}>
                  Privacy Policy
                </Link>
                .
              </Text>
              {errors.acceptedTerms?.message ? (
                <Text style={styles.errorText}>{errors.acceptedTerms.message}</Text>
              ) : null}
            </View>
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
  footerText: {
    color: colors.textMuted,
    fontSize: typography.body,
    textAlign: "center"
  },
  link: {
    color: colors.primaryDark,
    fontWeight: "800"
  },
  agreementBox: {
    gap: spacing.sm,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.primaryTint,
    padding: spacing.md
  },
  agreementText: {
    color: colors.textMuted,
    fontSize: typography.small,
    lineHeight: 19
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.small,
    fontWeight: "800"
  }
});
