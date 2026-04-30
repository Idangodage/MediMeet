import { useEffect, useMemo, useState } from "react";
import {
  Controller,
  useForm,
  type Control,
  type FieldValues,
  type Path
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { Alert, Image, StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/Screen";
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  LoadingState
} from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { colors, radius, spacing, typography } from "@/constants/theme";
import {
  doctorLocationSchema,
  doctorProfileSchema,
  type DoctorLocationFormValues,
  type DoctorProfileFormValues
} from "@/features/doctor/schemas/doctorProfile.schemas";
import {
  calculateDoctorProfileCompletion,
  formatDoctorProfileStatus,
  getOwnDoctorProfile,
  type DoctorProfileStatus,
  type ManagedDoctorProfile,
  updateOwnDoctorProfile,
  upsertDoctorLocation
} from "@/services/doctor.service";

const ownDoctorProfileQueryKey = ["own-doctor-profile"];

export function DoctorProfileManagementScreen() {
  const queryClient = useQueryClient();
  const profileQuery = useQuery({
    queryKey: ownDoctorProfileQueryKey,
    queryFn: getOwnDoctorProfile
  });

  if (profileQuery.isLoading) {
    return (
      <Screen>
        <LoadingState message="Loading your doctor profile..." />
      </Screen>
    );
  }

  if (profileQuery.isError) {
    return (
      <Screen>
        <ErrorState
          message={
            profileQuery.error instanceof Error
              ? profileQuery.error.message
              : "Unable to load your profile."
          }
          onRetry={() => void profileQuery.refetch()}
        />
      </Screen>
    );
  }

  if (!profileQuery.data) {
    return (
      <Screen>
        <EmptyState
          title="Doctor profile not found"
          message="Complete doctor onboarding before managing your public profile."
        />
        <Button title="Go to onboarding" onPress={() => router.replace(ROUTES.onboarding)} />
      </Screen>
    );
  }

  return (
    <DoctorProfileEditor
      profile={profileQuery.data}
      onRefresh={async () => {
        await queryClient.invalidateQueries({ queryKey: ownDoctorProfileQueryKey });
      }}
    />
  );
}

function DoctorProfileEditor({
  onRefresh,
  profile
}: {
  onRefresh: () => Promise<void>;
  profile: ManagedDoctorProfile;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const completion = useMemo(
    () => calculateDoctorProfileCompletion(profile),
    [profile]
  );
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<DoctorProfileFormValues>({
    resolver: zodResolver(doctorProfileSchema),
    defaultValues: getProfileFormDefaults(profile)
  });
  const profilePhotoUri = watch("profilePhotoUri");
  const profileMutation = useMutation({
    mutationFn: updateOwnDoctorProfile,
    onSuccess: async () => {
      await onRefresh();
      Alert.alert("Profile saved", "Your doctor profile has been updated.");
    },
    onError: (error) => {
      setFormError(
        error instanceof Error ? error.message : "Unable to update your profile."
      );
    }
  });

  useEffect(() => {
    reset(getProfileFormDefaults(profile));
  }, [profile, reset]);

  const pickProfilePhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setFormError("Photo library permission is required to update your profile image.");
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

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    profileMutation.mutate({
      ...values,
      yearsOfExperience: Number(values.yearsOfExperience),
      consultationFee: Number(values.consultationFee)
    });
  });

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>Doctor profile</Text>
          <Text style={styles.title}>Manage your public presence</Text>
          <Text style={styles.subtitle}>
            Complete every required section before requesting or maintaining
            verification. Unverified profiles stay hidden from public search unless
            platform policy changes.
          </Text>
        </View>
        <Badge
          label={formatDoctorProfileStatus(completion.status)}
          variant={getStatusBadgeVariant(completion.status)}
        />
      </View>

      <ProfileCompletionCard completionStatus={completion.status} profile={profile} />

      <Card title="Profile details" subtitle="These fields power your public profile.">
        {formError ? <ErrorState message={formError} /> : null}

        <View style={styles.photoRow}>
          {profilePhotoUri || profile.profileImageUrl ? (
            <Image
              source={{ uri: profilePhotoUri ?? profile.profileImageUrl ?? "" }}
              style={styles.photoPreview}
            />
          ) : (
            <Avatar name={profile.fullName} size={88} />
          )}
          <View style={styles.photoActions}>
            <Button title="Edit profile image" variant="secondary" onPress={pickProfilePhoto} />
            <Text style={styles.helperText}>Use a clear, professional headshot.</Text>
          </View>
        </View>

        <FormInput control={control} error={errors.title?.message} label="Title" name="title" placeholder="Dr., Consultant, Specialist" />
        <FormInput control={control} error={errors.fullName?.message} label="Full name" name="fullName" />
        <FormInput control={control} error={errors.registrationNumber?.message} label="Registration number" name="registrationNumber" />
        <FormInput control={control} error={errors.qualifications?.message} helperText="Separate multiple qualifications with commas." label="Qualifications" name="qualifications" />
        <FormInput control={control} error={errors.specialties?.message} helperText="Separate multiple specialties with commas." label="Specialties" name="specialties" />
        <FormInput control={control} error={errors.subspecialties?.message} helperText="Optional. Separate multiple subspecialties with commas." label="Subspecialties" name="subspecialties" />
        <FormInput control={control} error={errors.yearsOfExperience?.message} keyboardType="number-pad" label="Years of experience" name="yearsOfExperience" />
        <FormInput control={control} error={errors.languages?.message} helperText="Separate multiple languages with commas." label="Languages" name="languages" />
        <FormInput control={control} error={errors.consultationFee?.message} keyboardType="decimal-pad" label="Consultation fee" name="consultationFee" />
        <FormInput control={control} error={errors.services?.message} helperText="Example: First consultation, Follow-up visit, Telehealth." label="Services" name="services" />
        <FormInput control={control} error={errors.biography?.message} label="Biography" multiline name="biography" numberOfLines={6} style={styles.multilineInput} />

        <Button
          title="Save profile"
          isLoading={isSubmitting || profileMutation.isPending}
          onPress={onSubmit}
        />
      </Card>

      <DoctorLocationsManager profile={profile} onRefresh={onRefresh} />

      <View style={styles.actionRow}>
        <Button title="Preview profile" onPress={() => router.push(ROUTES.doctorProfilePreview)} />
        <Button title="Back to dashboard" variant="ghost" onPress={() => router.push(ROUTES.doctorHome)} />
      </View>
    </Screen>
  );
}

function ProfileCompletionCard({
  completionStatus,
  profile
}: {
  completionStatus: DoctorProfileStatus;
  profile: ManagedDoctorProfile;
}) {
  const completion = calculateDoctorProfileCompletion(profile);
  const isVerified = completionStatus === "verified";

  return (
    <Card
      title="Profile completion"
      subtitle={`${completion.completedFields} of ${completion.totalFields} required sections complete.`}
    >
      <View style={styles.progressHeader}>
        <Text style={styles.progressValue}>{completion.percentage}%</Text>
        <Badge
          label={formatDoctorProfileStatus(completion.status)}
          variant={getStatusBadgeVariant(completion.status)}
        />
      </View>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${completion.percentage}%` },
            isVerified ? styles.progressFillVerified : null
          ]}
        />
      </View>

      {!isVerified ? (
        <View style={styles.warningBox}>
          <Badge label="Not visible in public search" variant="warning" />
          <Text style={styles.bodyText}>
            Public discovery only lists doctors that are verified and marked public by
            the platform. You can still preview this profile privately.
          </Text>
        </View>
      ) : null}

      {completion.missingFields.length > 0 ? (
        <View style={styles.tags}>
          {completion.missingFields.map((field) => (
            <Badge key={field} label={field} variant="warning" />
          ))}
        </View>
      ) : (
        <Text style={styles.bodyText}>
          All profile sections are complete. Verification status controls public
          visibility.
        </Text>
      )}
    </Card>
  );
}

function DoctorLocationsManager({
  onRefresh,
  profile
}: {
  onRefresh: () => Promise<void>;
  profile: ManagedDoctorProfile;
}) {
  const [locationError, setLocationError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<DoctorLocationFormValues>({
    resolver: zodResolver(doctorLocationSchema),
    defaultValues: getEmptyLocationForm()
  });
  const isActive = watch("isActive");
  const locationMutation = useMutation({
    mutationFn: (values: DoctorLocationFormValues) =>
      upsertDoctorLocation({
        ...values,
        doctorId: profile.id
      }),
    onSuccess: async () => {
      reset(getEmptyLocationForm());
      await onRefresh();
    },
    onError: (error) => {
      setLocationError(
        error instanceof Error ? error.message : "Unable to save this location."
      );
    }
  });

  const onSubmit = handleSubmit((values) => {
    setLocationError(null);
    locationMutation.mutate(values);
  });

  return (
    <Card
      title="Visiting locations"
      subtitle="Add private-practice or clinic locations where patients can visit you."
    >
      {locationError ? <ErrorState message={locationError} /> : null}

      {profile.locations.length > 0 ? (
        <View style={styles.locationList}>
          {profile.locations.map((location) => (
            <View key={location.id} style={styles.locationCard}>
              <View style={styles.locationCopy}>
                <Text style={styles.locationName}>
                  {location.name ?? "Practice location"}
                </Text>
                <Text style={styles.bodyText}>
                  {[location.address, location.city].filter(Boolean).join(", ")}
                </Text>
              </View>
              <Badge
                label={location.isActive ? "Active" : "Inactive"}
                variant={location.isActive ? "success" : "neutral"}
              />
              <Button
                title="Edit"
                variant="secondary"
                onPress={() => {
                  reset({
                    id: location.id,
                    name: location.name ?? "",
                    address: location.address ?? "",
                    city: location.city ?? "",
                    isActive: location.isActive ?? true
                  });
                }}
              />
            </View>
          ))}
        </View>
      ) : (
        <EmptyState
          title="No visiting locations"
          message="Add at least one active location to complete your profile."
        />
      )}

      <View style={styles.locationForm}>
        <FormInput control={control} error={errors.name?.message} label="Location name" name="name" placeholder="MediMeet Private Clinic" />
        <FormInput control={control} error={errors.address?.message} label="Address" name="address" />
        <FormInput control={control} error={errors.city?.message} label="City" name="city" />
        <View style={styles.locationStatusRow}>
          <Badge label={isActive ? "Active location" : "Inactive location"} variant={isActive ? "success" : "neutral"} />
          <Button
            title={isActive ? "Mark inactive" : "Mark active"}
            variant="secondary"
            onPress={() => {
              setValue("isActive", !isActive, {
                shouldDirty: true,
                shouldValidate: true
              });
            }}
          />
        </View>
        <View style={styles.locationButtons}>
          <Button
            title="Save location"
            isLoading={isSubmitting || locationMutation.isPending}
            onPress={onSubmit}
          />
          <Button
            title="Clear"
            variant="ghost"
            onPress={() => reset(getEmptyLocationForm())}
          />
        </View>
      </View>
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
  error,
  helperText,
  label,
  name,
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

function getProfileFormDefaults(
  profile: ManagedDoctorProfile
): DoctorProfileFormValues {
  return {
    fullName: profile.fullName,
    title: profile.title ?? "",
    registrationNumber: profile.registrationNumber,
    qualifications: profile.qualifications.join(", "),
    specialties: profile.specialties.join(", "),
    subspecialties: profile.subspecialties.join(", "),
    yearsOfExperience: String(profile.yearsOfExperience),
    languages: profile.languages.join(", "),
    consultationFee: String(profile.consultationFee),
    biography: profile.biography ?? "",
    services: profile.services.join(", "),
    profilePhotoUri: null
  };
}

function getEmptyLocationForm(): DoctorLocationFormValues {
  return {
    id: undefined,
    name: "",
    address: "",
    city: "",
    isActive: true
  };
}

function getStatusBadgeVariant(status: DoctorProfileStatus) {
  if (status === "verified") {
    return "success";
  }

  if (status === "rejected" || status === "suspended") {
    return "danger";
  }

  if (status === "incomplete" || status === "needs_update") {
    return "warning";
  }

  return "neutral";
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.md
  },
  headerCopy: {
    gap: spacing.sm
  },
  eyebrow: {
    color: colors.primary,
    fontSize: typography.small,
    fontWeight: "900",
    textTransform: "uppercase"
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
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.surfaceMuted
  },
  photoActions: {
    flex: 1,
    gap: spacing.sm
  },
  helperText: {
    color: colors.textMuted,
    fontSize: typography.small,
    lineHeight: 18
  },
  multilineInput: {
    minHeight: 140,
    paddingTop: spacing.md,
    textAlignVertical: "top"
  },
  progressHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  progressValue: {
    color: colors.text,
    fontSize: 34,
    fontWeight: "900"
  },
  progressTrack: {
    height: 12,
    overflow: "hidden",
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted
  },
  progressFill: {
    height: "100%",
    borderRadius: radius.full,
    backgroundColor: colors.warning
  },
  progressFillVerified: {
    backgroundColor: colors.success
  },
  warningBox: {
    gap: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.warningSoft,
    padding: spacing.md
  },
  bodyText: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  locationList: {
    gap: spacing.md
  },
  locationCard: {
    gap: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    padding: spacing.md
  },
  locationCopy: {
    gap: spacing.xs
  },
  locationName: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  locationForm: {
    gap: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.lg
  },
  locationStatusRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  locationButtons: {
    gap: spacing.sm
  },
  actionRow: {
    gap: spacing.sm
  }
});
