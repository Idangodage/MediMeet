import { useState } from "react";
import {
  Controller,
  useForm,
  type Control,
  type FieldValues,
  type Path
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as ImagePicker from "expo-image-picker";
import { Redirect, router, type Href } from "expo-router";
import { Image, StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/Screen";
import { Avatar, Button, Card, ErrorState, Input } from "@/components/ui";
import { getHomeRouteForRole } from "@/constants/routes";
import { colors, spacing, typography } from "@/constants/theme";
import { useAuth } from "@/features/auth";
import {
  clinicAdminOnboardingSchema,
  doctorOnboardingSchema,
  patientOnboardingSchema,
  type ClinicAdminOnboardingFormValues,
  type DoctorOnboardingFormValues,
  type PatientOnboardingFormValues
} from "@/features/auth/schemas/onboarding.schemas";
import {
  completeClinicAdminOnboarding,
  completeDoctorOnboarding,
  completePatientOnboarding
} from "@/services/onboarding.service";

export function OnboardingScreen() {
  const { isOnboardingComplete, profile, refreshProfile, role, user } = useAuth();

  if (role === "guest" || role === "platform_admin") {
    return <Redirect href={getHomeRouteForRole(role) as Href} />;
  }

  if (isOnboardingComplete) {
    return <Redirect href={getHomeRouteForRole(role) as Href} />;
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.brand}>MediMeet onboarding</Text>
        <Text style={styles.title}>{getOnboardingTitle(role)}</Text>
        <Text style={styles.subtitle}>
          Complete these details once so your dashboard can be configured
          correctly.
        </Text>
      </View>

      {role === "patient" ? (
        <PatientOnboardingForm
          defaultFullName={profile?.fullName ?? user?.user_metadata?.full_name}
          onComplete={async () => {
            await refreshProfile();
            router.replace(getHomeRouteForRole(role));
          }}
        />
      ) : null}

      {role === "doctor" ? (
        <DoctorOnboardingForm
          defaultFullName={profile?.fullName ?? user?.user_metadata?.full_name}
          onComplete={async () => {
            await refreshProfile();
            router.replace(getHomeRouteForRole(role));
          }}
        />
      ) : null}

      {role === "clinic_admin" ? (
        <ClinicAdminOnboardingForm
          onComplete={async () => {
            await refreshProfile();
            router.replace(getHomeRouteForRole(role));
          }}
        />
      ) : null}
    </Screen>
  );
}

function PatientOnboardingForm({
  defaultFullName,
  onComplete
}: {
  defaultFullName?: string | null;
  onComplete: () => Promise<void>;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<PatientOnboardingFormValues>({
    resolver: zodResolver(patientOnboardingSchema),
    defaultValues: {
      fullName: defaultFullName ?? "",
      phone: "",
      city: "",
      preferredLanguage: "English"
    }
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      await completePatientOnboarding(values);
      await onComplete();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Unable to complete onboarding."
      );
    }
  });

  return (
    <Card title="Patient details" subtitle="Used for appointment communication.">
      {formError ? <ErrorState message={formError} /> : null}
      <FormInput control={control} error={errors.fullName?.message} label="Full name" name="fullName" />
      <FormInput control={control} error={errors.phone?.message} keyboardType="phone-pad" label="Phone" name="phone" />
      <FormInput control={control} error={errors.city?.message} label="City" name="city" />
      <FormInput control={control} error={errors.preferredLanguage?.message} label="Preferred language" name="preferredLanguage" />
      <Button title="Complete patient onboarding" isLoading={isSubmitting} onPress={onSubmit} />
    </Card>
  );
}

function DoctorOnboardingForm({
  defaultFullName,
  onComplete
}: {
  defaultFullName?: string | null;
  onComplete: () => Promise<void>;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<DoctorOnboardingFormValues>({
    resolver: zodResolver(doctorOnboardingSchema),
    defaultValues: {
      fullName: defaultFullName ?? "",
      title: "",
      registrationNumber: "",
      qualifications: "",
      specialty: "",
      yearsOfExperience: "",
      languages: "",
      consultationFee: "",
      biography: "",
      profilePhotoUri: null
    }
  });
  const profilePhotoUri = watch("profilePhotoUri");

  const pickProfilePhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setFormError("Photo library permission is required to add a profile photo.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: ["images"],
      quality: 0.8
    });

    if (!result.canceled) {
      setValue("profilePhotoUri", result.assets[0]?.uri ?? null, {
        shouldDirty: true,
        shouldValidate: true
      });
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      await completeDoctorOnboarding({
        ...values,
        yearsOfExperience: Number(values.yearsOfExperience),
        consultationFee: Number(values.consultationFee)
      });
      await onComplete();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Unable to complete onboarding."
      );
    }
  });

  return (
    <Card
      title="Doctor profile"
      subtitle="Your profile starts private until platform verification approves it."
    >
      {formError ? <ErrorState message={formError} /> : null}

      <View style={styles.photoRow}>
        {profilePhotoUri ? (
          <Image source={{ uri: profilePhotoUri }} style={styles.photoPreview} />
        ) : (
          <Avatar name={defaultFullName} size={72} />
        )}
        <Button title="Choose profile photo" variant="secondary" onPress={pickProfilePhoto} />
      </View>

      <FormInput control={control} error={errors.fullName?.message} label="Full name" name="fullName" />
      <FormInput control={control} error={errors.title?.message} label="Title" name="title" placeholder="Dr., Consultant, Specialist" />
      <FormInput control={control} error={errors.registrationNumber?.message} label="Registration number" name="registrationNumber" />
      <FormInput control={control} error={errors.qualifications?.message} helperText="Separate multiple qualifications with commas." label="Qualifications" name="qualifications" />
      <FormInput control={control} error={errors.specialty?.message} label="Specialty" name="specialty" placeholder="Cardiology" />
      <FormInput control={control} error={errors.yearsOfExperience?.message} keyboardType="number-pad" label="Years of experience" name="yearsOfExperience" />
      <FormInput control={control} error={errors.languages?.message} helperText="Separate multiple languages with commas." label="Languages" name="languages" />
      <FormInput control={control} error={errors.consultationFee?.message} keyboardType="decimal-pad" label="Consultation fee" name="consultationFee" />
      <FormInput control={control} error={errors.biography?.message} label="Biography" multiline name="biography" numberOfLines={5} style={styles.multilineInput} />
      <Button title="Submit doctor profile" isLoading={isSubmitting} onPress={onSubmit} />
    </Card>
  );
}

function ClinicAdminOnboardingForm({
  onComplete
}: {
  onComplete: () => Promise<void>;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<ClinicAdminOnboardingFormValues>({
    resolver: zodResolver(clinicAdminOnboardingSchema),
    defaultValues: {
      clinicName: "",
      clinicEmail: "",
      clinicPhone: "",
      clinicLocation: ""
    }
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      await completeClinicAdminOnboarding(values);
      await onComplete();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Unable to complete onboarding."
      );
    }
  });

  return (
    <Card title="Clinic workspace" subtitle="Create the first clinic location.">
      {formError ? <ErrorState message={formError} /> : null}
      <FormInput control={control} error={errors.clinicName?.message} label="Clinic name" name="clinicName" />
      <FormInput control={control} error={errors.clinicEmail?.message} keyboardType="email-address" label="Clinic email" name="clinicEmail" />
      <FormInput control={control} error={errors.clinicPhone?.message} keyboardType="phone-pad" label="Clinic phone" name="clinicPhone" />
      <FormInput control={control} error={errors.clinicLocation?.message} label="Clinic location" name="clinicLocation" placeholder="Street address, city" />
      <Button title="Create clinic workspace" isLoading={isSubmitting} onPress={onSubmit} />
    </Card>
  );
}

type FormInputProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label: string;
  error?: string;
  helperText?: string;
  keyboardType?: "default" | "email-address" | "phone-pad" | "number-pad" | "decimal-pad";
  multiline?: boolean;
  numberOfLines?: number;
  placeholder?: string;
  style?: object;
};

function FormInput<T extends FieldValues>({
  control,
  name,
  label,
  error,
  helperText,
  ...props
}: FormInputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onBlur, onChange, value } }) => (
        <Input
          error={error}
          helperText={helperText}
          label={label}
          onBlur={onBlur}
          onChangeText={onChange}
          value={typeof value === "string" ? value : ""}
          {...props}
        />
      )}
    />
  );
}

function getOnboardingTitle(role: "patient" | "doctor" | "clinic_admin") {
  if (role === "patient") {
    return "Set up your patient profile";
  }

  if (role === "doctor") {
    return "Build your doctor profile";
  }

  return "Create your clinic workspace";
}

const styles = StyleSheet.create({
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
  photoRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.lg
  },
  photoPreview: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surfaceMuted
  },
  multilineInput: {
    minHeight: 120,
    paddingTop: spacing.md,
    textAlignVertical: "top"
  }
});
