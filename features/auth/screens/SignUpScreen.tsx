import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, router, useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/Screen";
import { Button } from "@/components/ui";
import { fontStyles } from "@/constants/fonts";
import { ROUTES } from "@/constants/routes";
import { colors, spacing, typography } from "@/constants/theme";
import { AuthBackButton } from "@/features/auth/components/AuthBackButton";
import { AuthGlyph } from "@/features/auth/components/AuthGlyph";
import { AuthGooglePlaceholderButton } from "@/features/auth/components/AuthGooglePlaceholderButton";
import { AuthOrDivider } from "@/features/auth/components/AuthOrDivider";
import { AuthTextField } from "@/features/auth/components/AuthTextField";
import { PublicBrandLockup } from "@/features/public/components/PublicBrandLockup";
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
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const {
    control,
    handleSubmit,
    watch,
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

  const selectedRole = watch("role");

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
      <View style={styles.topRow}>
        <AuthBackButton
          onPress={() =>
            router.push(`/role-intro/${selectedRole ?? initialRole}` as const)
          }
        />
      </View>

      <View style={styles.header}>
        <PublicBrandLockup centered />
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>Start with your basic details</Text>
      </View>

      <View style={styles.roleCard}>
        <View style={styles.roleCardLeft}>
          <View style={styles.roleIconCircle}>
            <AuthGlyph name="user" color={colors.white} />
          </View>
          <Text style={styles.roleText}>
            Selected role:{" "}
            <Text style={styles.roleHighlight}>
              {formatRoleLabel(selectedRole ?? initialRole)}
            </Text>
          </Text>
        </View>
        <Link href={ROUTES.roleSelection} style={styles.changeLink}>
          Change {">"}
        </Link>
      </View>

      {formError ? <Text style={styles.errorBanner}>{formError}</Text> : null}

      <View style={styles.form}>
        <Controller
          control={control}
          name="fullName"
          render={({ field: { onBlur, onChange, value } }) => (
            <AuthTextField
              autoCapitalize="words"
              error={errors.fullName?.message}
              leftIcon="user"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Full Name"
              textContentType="name"
              value={value}
            />
          )}
        />

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
              leftIcon="mail"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Email Address"
              textContentType="emailAddress"
              value={value}
            />
          )}
        />

        <Controller
          control={control}
          name="phone"
          render={({ field: { onBlur, onChange, value } }) => (
            <AuthTextField
              autoComplete="tel"
              error={errors.phone?.message}
              keyboardType="phone-pad"
              leftIcon="phone"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Phone Number"
              textContentType="telephoneNumber"
              value={value ?? ""}
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
              leftIcon="lock"
              onBlur={onBlur}
              onChangeText={onChange}
              onRightIconPress={() => setIsPasswordVisible((current) => !current)}
              placeholder="Password"
              rightIcon={isPasswordVisible ? "eye" : "eyeOff"}
              secureTextEntry={!isPasswordVisible}
              textContentType="newPassword"
              value={value}
            />
          )}
        />

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onBlur, onChange, value } }) => (
            <AuthTextField
              autoCapitalize="none"
              error={errors.confirmPassword?.message}
              leftIcon="lock"
              onBlur={onBlur}
              onChangeText={onChange}
              onRightIconPress={() =>
                setIsConfirmPasswordVisible((current) => !current)
              }
              placeholder="Confirm Password"
              rightIcon={isConfirmPasswordVisible ? "eye" : "eyeOff"}
              secureTextEntry={!isConfirmPasswordVisible}
              textContentType="newPassword"
              value={value}
            />
          )}
        />

        <Controller
          control={control}
          name="acceptedTerms"
          render={({ field: { onChange, value } }) => (
            <View style={styles.agreementRow}>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: value }}
                onPress={() => onChange(!value)}
                style={[styles.checkbox, value ? styles.checkboxChecked : null]}
              >
                {value ? <Text style={styles.checkboxTick}>v</Text> : null}
              </Pressable>
              <Text style={styles.agreementText}>
                I agree to the{" "}
                <Link href={ROUTES.terms} style={styles.link}>
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href={ROUTES.privacy} style={styles.link}>
                  Privacy Policy
                </Link>
              </Text>
            </View>
          )}
        />

        {errors.acceptedTerms?.message ? (
          <Text style={styles.errorText}>{errors.acceptedTerms.message}</Text>
        ) : null}

        <Button
          title="Create Account"
          isLoading={isSubmitting}
          onPress={onSubmit}
          style={styles.primaryButton}
        />
      </View>

      <AuthOrDivider />

      <AuthGooglePlaceholderButton title="Continue with Google" />

      <Text style={styles.footerText}>
        Already have an account?{" "}
        <Link href={ROUTES.signIn} style={styles.link}>
          Log In
        </Link>
      </Text>
    </Screen>
  );
}

function formatRoleLabel(role: string) {
  if (role === "clinic_admin") {
    return "Clinic Admin";
  }

  return role.charAt(0).toUpperCase() + role.slice(1);
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
    ...fontStyles.extraBold
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 18,
    lineHeight: 24,
    ...fontStyles.regular
  },
  roleCard: {
    minHeight: 88,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#D7E4FA",
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg
  },
  roleCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1
  },
  roleIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center"
  },
  roleText: {
    color: "#6579A6",
    fontSize: 18,
    ...fontStyles.medium
  },
  roleHighlight: {
    color: colors.primary,
    ...fontStyles.bold
  },
  changeLink: {
    color: "#2D73E1",
    fontSize: 18,
    ...fontStyles.medium
  },
  errorBanner: {
    color: colors.danger,
    fontSize: typography.small,
    ...fontStyles.semiBold
  },
  form: {
    gap: spacing.md
  },
  agreementRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md
  },
  checkbox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#7C96C3",
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center"
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  checkboxTick: {
    color: colors.white,
    fontSize: 18,
    lineHeight: 18,
    ...fontStyles.bold
  },
  agreementText: {
    flex: 1,
    color: "#556E9B",
    fontSize: 16,
    lineHeight: 24,
    ...fontStyles.regular
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.small,
    ...fontStyles.bold
  },
  primaryButton: {
    minHeight: 78
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
