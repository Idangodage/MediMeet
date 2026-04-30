import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/Screen";
import {
  Badge,
  Button,
  Card,
  ErrorState,
  Input,
  LoadingState
} from "@/components/ui";
import { colors, spacing, typography } from "@/constants/theme";
import { useAuth } from "@/features/auth";
import {
  patientProfileSettingsSchema,
  type PatientProfileSettingsFormValues
} from "@/features/patient/schemas/profileSettings.schemas";
import {
  getOwnPatientProfileSettings,
  updateOwnPatientProfileSettings
} from "@/services/patient.service";

export function PatientProfileSettingsScreen() {
  const { refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const profileQuery = useQuery({
    queryKey: ["patient-profile-settings"],
    queryFn: getOwnPatientProfileSettings
  });
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<PatientProfileSettingsFormValues>({
    resolver: zodResolver(patientProfileSettingsSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      city: "",
      preferredLanguage: "en"
    }
  });
  const updateMutation = useMutation({
    mutationFn: updateOwnPatientProfileSettings,
    onSuccess: async () => {
      await Promise.all([
        refreshProfile(),
        queryClient.invalidateQueries({ queryKey: ["patient-profile-settings"] })
      ]);
      Alert.alert("Profile updated", "Your patient profile settings were saved.");
    },
    onError: (error) => {
      Alert.alert(
        "Unable to update profile",
        error instanceof Error ? error.message : "Please try again."
      );
    }
  });

  useEffect(() => {
    if (profileQuery.data) {
      reset(profileQuery.data);
    }
  }, [profileQuery.data, reset]);

  return (
    <Screen>
      <View style={styles.header}>
        <Badge label="Private settings" variant="success" />
        <Text style={styles.title}>Patient profile settings</Text>
        <Text style={styles.subtitle}>
          Keep your contact details and communication preferences current.
        </Text>
      </View>

      {profileQuery.isLoading ? (
        <LoadingState message="Loading profile settings..." />
      ) : null}

      {profileQuery.isError ? (
        <ErrorState
          message={
            profileQuery.error instanceof Error
              ? profileQuery.error.message
              : "Unable to load profile settings."
          }
          onRetry={() => void profileQuery.refetch()}
        />
      ) : null}

      {profileQuery.data ? (
        <Card
          title="Personal details"
          subtitle="Email comes from Supabase Auth and is shown for reference."
        >
          <FormInput
            control={control}
            error={errors.fullName?.message}
            label="Full name"
            name="fullName"
          />
          <FormInput
            control={control}
            editable={false}
            error={errors.email?.message}
            label="Email"
            name="email"
          />
          <FormInput
            control={control}
            error={errors.phone?.message}
            label="Phone"
            name="phone"
          />
          <FormInput
            control={control}
            error={errors.dateOfBirth?.message}
            label="Date of birth"
            name="dateOfBirth"
            placeholder="YYYY-MM-DD"
          />
          <FormInput
            control={control}
            error={errors.city?.message}
            label="City"
            name="city"
          />
          <FormInput
            control={control}
            error={errors.preferredLanguage?.message}
            label="Preferred language"
            name="preferredLanguage"
            placeholder="en"
          />

          <Button
            title="Save profile settings"
            isLoading={updateMutation.isPending}
            onPress={handleSubmit((values) => updateMutation.mutate(values))}
          />
        </Card>
      ) : null}
    </Screen>
  );
}

type FormInputProps = {
  control: ReturnType<typeof useForm<PatientProfileSettingsFormValues>>["control"];
  name: keyof PatientProfileSettingsFormValues;
  label: string;
  error?: string;
  editable?: boolean;
  placeholder?: string;
};

function FormInput({
  control,
  error,
  label,
  name,
  ...props
}: FormInputProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onBlur, onChange, value } }) => (
        <Input
          error={error}
          label={label}
          onBlur={onBlur}
          onChangeText={onChange}
          value={value}
          {...props}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "900"
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24
  }
});
