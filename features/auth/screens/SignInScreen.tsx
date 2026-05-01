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
import { AuthGooglePlaceholderButton } from "@/features/auth/components/AuthGooglePlaceholderButton";
import { AuthOrDivider } from "@/features/auth/components/AuthOrDivider";
import { AuthTextField } from "@/features/auth/components/AuthTextField";
import { PublicBrandLockup } from "@/features/public/components/PublicBrandLockup";
import {
  signInSchema,
  type SignInFormValues
} from "@/features/auth/schemas/auth.schemas";
import { signInWithEmail } from "@/services/auth.service";

export function SignInScreen() {
  const [formError, setFormError] = useState<string | null>(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
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
        <PublicBrandLockup centered />
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Log in to continue</Text>
      </View>

      {formError ? <Text style={styles.errorBanner}>{formError}</Text> : null}

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
              placeholder="Enter your email"
              textContentType="emailAddress"
              value={value}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onBlur, onChange, value } }) => (
            <AuthTextField
              autoCapitalize="none"
              error={errors.password?.message}
              label="Password"
              leftIcon="lock"
              onBlur={onBlur}
              onChangeText={onChange}
              onRightIconPress={() => setIsPasswordVisible((current) => !current)}
              placeholder="Enter your password"
              rightIcon={isPasswordVisible ? "eye" : "eyeOff"}
              secureTextEntry={!isPasswordVisible}
              textContentType="password"
              value={value}
            />
          )}
        />

        <Link href={ROUTES.forgotPassword} style={styles.forgotLink}>
          Forgot password?
        </Link>

        <Button
          title="Log In"
          isLoading={isSubmitting}
          leftIcon={
            <View style={styles.buttonIconCircle}>
              <Text style={styles.buttonIconArrow}>{">"}</Text>
            </View>
          }
          onPress={onSubmit}
          style={styles.primaryButton}
        />
      </View>

      <AuthOrDivider />

      <AuthGooglePlaceholderButton title="Continue with Google" />

      <Text style={styles.footerText}>
        Don't have an account?{" "}
        <Link href={ROUTES.signUp} style={styles.link}>
          Sign Up
        </Link>
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
    paddingBottom: spacing["3xl"]
  },
  header: {
    alignItems: "center",
    gap: spacing.lg,
    paddingTop: spacing["2xl"]
  },
  title: {
    color: colors.text,
    fontSize: 52,
    lineHeight: 58,
    textAlign: "center",
    ...fontStyles.extraBold
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 18,
    lineHeight: 24,
    ...fontStyles.regular
  },
  errorBanner: {
    color: colors.danger,
    fontSize: typography.small,
    ...fontStyles.semiBold
  },
  form: {
    gap: spacing.lg
  },
  forgotLink: {
    alignSelf: "flex-end",
    color: "#2D73E1",
    fontSize: 18,
    ...fontStyles.medium
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
  buttonIconArrow: {
    color: colors.primary,
    fontSize: 26,
    lineHeight: 26,
    ...fontStyles.bold
  },
  footerText: {
    color: colors.textMuted,
    fontSize: 18,
    textAlign: "center",
    ...fontStyles.regular
  },
  link: {
    color: "#2D73E1",
    ...fontStyles.bold
  }
});
