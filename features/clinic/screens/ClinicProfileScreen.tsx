import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";
import { Controller, useForm, type Control, type FieldValues, type Path } from "react-hook-form";
import { Alert, Image, StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/Screen";
import {
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
  clinicLocationSchema,
  clinicProfileSchema,
  type ClinicLocationFormValues,
  type ClinicProfileFormValues
} from "@/features/clinic/schemas/clinic.schemas";
import {
  getClinicWorkspace,
  saveClinicProfile,
  upsertClinicLocation,
  type ClinicLocation,
  type ClinicProfile
} from "@/services/clinic.service";

const clinicWorkspaceQueryKey = ["clinic-workspace"];

export function ClinicProfileScreen() {
  const queryClient = useQueryClient();
  const workspaceQuery = useQuery({
    queryKey: clinicWorkspaceQueryKey,
    queryFn: getClinicWorkspace
  });

  if (workspaceQuery.isLoading) {
    return (
      <Screen>
        <LoadingState message="Loading clinic profile..." />
      </Screen>
    );
  }

  if (workspaceQuery.isError) {
    return (
      <Screen>
        <ErrorState
          message={
            workspaceQuery.error instanceof Error
              ? workspaceQuery.error.message
              : "Unable to load clinic profile."
          }
          onRetry={() => void workspaceQuery.refetch()}
        />
      </Screen>
    );
  }

  return (
    <ClinicProfileEditor
      clinic={workspaceQuery.data?.clinic ?? null}
      locations={workspaceQuery.data?.locations ?? []}
      onRefresh={async () => {
        await queryClient.invalidateQueries({
          queryKey: clinicWorkspaceQueryKey
        });
      }}
    />
  );
}

function ClinicProfileEditor({
  clinic,
  locations,
  onRefresh
}: {
  clinic: ClinicProfile | null;
  locations: ClinicLocation[];
  onRefresh: () => Promise<void>;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<ClinicProfileFormValues>({
    resolver: zodResolver(clinicProfileSchema),
    defaultValues: {
      description: clinic?.description ?? "",
      email: clinic?.email ?? "",
      logoUri: null,
      name: clinic?.name ?? "",
      phone: clinic?.phone ?? "",
      website: clinic?.website ?? ""
    }
  });
  const logoUri = watch("logoUri");
  const profileMutation = useMutation({
    mutationFn: saveClinicProfile,
    onSuccess: async () => {
      await onRefresh();
      Alert.alert("Clinic saved", "Clinic profile details were updated.");
    },
    onError: (error) => {
      setFormError(
        error instanceof Error ? error.message : "Unable to save clinic profile."
      );
    }
  });

  const pickLogo = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setFormError("Photo library permission is required to upload a clinic logo.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: ["images"],
      quality: 0.85
    });

    if (!result.canceled) {
      setValue("logoUri", result.assets[0]?.uri ?? null, {
        shouldDirty: true,
        shouldValidate: true
      });
    }
  };
  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    profileMutation.mutate(values);
  });

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Clinic profile</Text>
        <Text style={styles.title}>
          {clinic ? "Manage clinic details" : "Create clinic profile"}
        </Text>
        <Text style={styles.subtitle}>
          Clinic admins can manage only the clinic linked to their active admin
          membership.
        </Text>
      </View>

      <Card title="Clinic details" subtitle="These fields appear in clinic operations.">
        {formError ? <ErrorState message={formError} /> : null}

        <View style={styles.logoRow}>
          {logoUri || clinic?.logoUrl ? (
            <Image source={{ uri: logoUri ?? clinic?.logoUrl ?? "" }} style={styles.logo} />
          ) : (
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoText}>
                {(clinic?.name ?? "Clinic").slice(0, 2).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.logoActions}>
            <Button title="Add clinic logo" variant="secondary" onPress={pickLogo} />
            <Text style={styles.helperText}>Use a square PNG, JPEG, or WebP logo.</Text>
          </View>
        </View>

        <FormInput control={control} error={errors.name?.message} label="Clinic name" name="name" />
        <FormInput control={control} error={errors.email?.message} keyboardType="email-address" label="Clinic email" name="email" />
        <FormInput control={control} error={errors.phone?.message} keyboardType="phone-pad" label="Clinic phone" name="phone" />
        <FormInput control={control} error={errors.website?.message} label="Website" name="website" placeholder="https://clinic.example.com" />
        <FormInput control={control} error={errors.description?.message} label="Description" multiline name="description" numberOfLines={5} style={styles.multilineInput} />

        <Button
          title={clinic ? "Save clinic profile" : "Create clinic profile"}
          isLoading={isSubmitting || profileMutation.isPending}
          onPress={onSubmit}
        />
      </Card>

      <ClinicLocationsManager locations={locations} onRefresh={onRefresh} />

      <Button
        title="Back to clinic dashboard"
        variant="ghost"
        onPress={() => router.push(ROUTES.clinicHome)}
      />
    </Screen>
  );
}

function ClinicLocationsManager({
  locations,
  onRefresh
}: {
  locations: ClinicLocation[];
  onRefresh: () => Promise<void>;
}) {
  const [locationError, setLocationError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ClinicLocationFormValues>({
    resolver: zodResolver(clinicLocationSchema),
    defaultValues: getEmptyLocationForm()
  });
  const locationMutation = useMutation({
    mutationFn: upsertClinicLocation,
    onSuccess: async () => {
      reset(getEmptyLocationForm());
      await onRefresh();
    },
    onError: (error) => {
      setLocationError(
        error instanceof Error ? error.message : "Unable to save clinic location."
      );
    }
  });
  const onSubmit = handleSubmit((values) => {
    setLocationError(null);
    locationMutation.mutate(values);
  });

  return (
    <Card title="Clinic locations" subtitle="Add addresses and optional opening hours.">
      {locationError ? <ErrorState message={locationError} /> : null}

      {locations.length > 0 ? (
        <View style={styles.locationList}>
          {locations.map((location) => (
            <View key={location.id} style={styles.locationCard}>
              <View style={styles.locationCopy}>
                <Text style={styles.locationName}>{location.city}</Text>
                <Text style={styles.bodyText}>{location.address}</Text>
                {location.openingHours ? (
                  <Text style={styles.helperText}>{location.openingHours}</Text>
                ) : null}
              </View>
              <Button
                title="Edit"
                variant="secondary"
                onPress={() =>
                  reset({
                    address: location.address,
                    city: location.city,
                    id: location.id,
                    latitude: location.latitude ? String(location.latitude) : "",
                    longitude: location.longitude ? String(location.longitude) : "",
                    openingHours: location.openingHours ?? ""
                  })
                }
              />
            </View>
          ))}
        </View>
      ) : (
        <EmptyState
          title="No clinic locations"
          message="Add at least one clinic location before inviting doctors to visit patients there."
        />
      )}

      <FormInput control={control} error={errors.address?.message} label="Address" name="address" />
      <FormInput control={control} error={errors.city?.message} label="City" name="city" />
      <FormInput control={control} error={errors.latitude?.message} keyboardType="decimal-pad" label="Latitude" name="latitude" />
      <FormInput control={control} error={errors.longitude?.message} keyboardType="decimal-pad" label="Longitude" name="longitude" />
      <FormInput control={control} error={errors.openingHours?.message} helperText="Plain text is accepted; JSON objects are stored as structured opening hours." label="Opening hours" name="openingHours" />

      <View style={styles.actionRow}>
        <Button
          title="Save location"
          isLoading={isSubmitting || locationMutation.isPending}
          onPress={onSubmit}
        />
        <Button title="Clear" variant="ghost" onPress={() => reset(getEmptyLocationForm())} />
      </View>
    </Card>
  );
}

type FormInputProps<T extends FieldValues> = {
  control: Control<T>;
  error?: string;
  helperText?: string;
  keyboardType?: "decimal-pad" | "default" | "email-address" | "phone-pad";
  label: string;
  multiline?: boolean;
  name: Path<T>;
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

function getEmptyLocationForm(): ClinicLocationFormValues {
  return {
    address: "",
    city: "",
    id: undefined,
    latitude: "",
    longitude: "",
    openingHours: ""
  };
}

const styles = StyleSheet.create({
  header: {
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
    fontWeight: "900"
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24
  },
  logoRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.lg
  },
  logo: {
    width: 88,
    height: 88,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted
  },
  logoPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    width: 88,
    height: 88,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft
  },
  logoText: {
    color: colors.primaryDark,
    fontSize: typography.subtitle,
    fontWeight: "900"
  },
  logoActions: {
    flex: 1,
    gap: spacing.sm
  },
  helperText: {
    color: colors.textMuted,
    fontSize: typography.small,
    lineHeight: 18
  },
  multilineInput: {
    minHeight: 120,
    paddingTop: spacing.md,
    textAlignVertical: "top"
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
  bodyText: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24
  },
  actionRow: {
    gap: spacing.sm
  }
});
