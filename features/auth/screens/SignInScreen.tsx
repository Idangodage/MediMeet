import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/Screen";
import { Button, Card, ErrorState, Input } from "@/components/ui";
import { colors, spacing, typography } from "@/constants/theme";
import { ROUTES } from "@/constants/routes";
import {
  signInSchema,
  type SignInFormValues
} from "@/features/auth/schemas/auth.schemas";
import { signInWithEmail } from "@/services/auth.service";

export function SignInScreen() {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      await signInWithEmail(values);
      router.replace(ROUTES.root);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Unable to sign in right now."
      );
    }
  });

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.brand}>MediMeet</Text>
        <Text style={styles.title}>Sign in to your practice workspace</Text>
        <Text style={styles.subtitle}>
          Secure access for patients, clinicians, clinic teams, and platform
          operators.
        </Text>
      </View>

      <Card>
        {formError ? <ErrorState message={formError} /> : null}

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
              placeholder="Your password"
              secureTextEntry
              textContentType="password"
              value={value}
            />
          )}
        />

        <Button title="Sign in" isLoading={isSubmitting} onPress={onSubmit} />
        <Link href={ROUTES.forgotPassword} asChild>
          <Button title="Forgot password?" variant="ghost" />
        </Link>
      </Card>

      <Text style={styles.footerText}>
        New to MediMeet?{" "}
        <Link href={ROUTES.signUp} style={styles.link}>
          Create an account
        </Link>
      </Text>
      <Text style={styles.footerText}>
        Browsing as a guest?{" "}
        <Link href={ROUTES.doctors} style={styles.link}>
          View public doctors
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
  }
});
