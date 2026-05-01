import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";
import { Controller, useForm, type Control, type FieldValues, type Path } from "react-hook-form";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";

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
import { colors, radius, shadows, spacing, typography } from "@/constants/theme";
import { useAuth } from "@/features/auth";
import { PatientGlyph } from "@/features/patient/components/PatientGlyph";
import { PublicBrandLockup } from "@/features/public/components/PublicBrandLockup";
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
  const { signOut } = useAuth();
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
    <Screen contentStyle={styles.content}>
      <View style={styles.topRow}>
        <PublicBrandLockup />
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push(ROUTES.notifications)}
          style={styles.bellButton}
        >
          <PatientGlyph name="bell" color="#0F2C66" />
          <View style={styles.bellDot} />
        </Pressable>
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>
          {clinic ? "Clinic Profile & Settings" : "Set up your clinic profile"}
        </Text>
        <Text style={styles.subtitle}>
          {clinic
            ? "Manage your clinic details, locations, and settings."
            : "Create a professional clinic presence for patients and doctors."}
        </Text>
      </View>

      {clinic ? (
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={styles.summaryIdentity}>
              {logoUri || clinic.logoUrl ? (
                <Image source={{ uri: logoUri ?? clinic.logoUrl ?? "" }} style={styles.summaryLogo} />
              ) : (
                <View style={styles.summaryLogoFallback}>
                  <Text style={styles.logoText}>
                    {(clinic.name ?? "Clinic").slice(0, 2).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.summaryCopy}>
                <Text style={styles.summaryTitle}>{clinic.name}</Text>
                <Text style={styles.summaryMeta}>{clinic.email ?? "Clinic email"}</Text>
                <Text style={styles.summaryMeta}>{clinic.phone ?? "Clinic phone"}</Text>
              </View>
            </View>
            <Button
              title="Edit"
              variant="secondary"
              onPress={() =>
                Alert.alert(
                  "Edit clinic profile",
                  "Update the clinic details below and save your changes."
                )
              }
            />
          </View>
          <View style={styles.summaryFooter}>
            <View style={styles.planPill}>
              <PatientGlyph name="shield" color={colors.primary} size={18} />
              <Text style={styles.planPillText}>Clinic workspace</Text>
            </View>
            <Text style={styles.summaryMeta}>
              {locations.length} location{locations.length === 1 ? "" : "s"}
            </Text>
          </View>
        </View>
      ) : null}

      <View style={styles.menuCard}>
        <SettingsShortcut
          description="View and update your clinic information."
          icon="bookmark"
          label="Clinic Details"
          onPress={() =>
            Alert.alert(
              "Clinic details",
              "Use the clinic details form below to update your clinic profile."
            )
          }
        />
        <SettingsShortcut
          description="Manage connected doctors and staff access."
          icon="user"
          label="Doctors & Staff"
          onPress={() => router.push(ROUTES.clinicDoctors)}
        />
        <SettingsShortcut
          description="Manage clinic locations and opening hours."
          icon="location"
          label="Locations & Hours"
          onPress={() =>
            Alert.alert(
              "Locations & hours",
              "Use the location manager below to add or edit clinic branches."
            )
          }
        />
        <SettingsShortcut
          description="Manage subscriptions, payments, and receipts."
          icon="shield"
          label="Billing & Receipts"
          onPress={() => router.push(ROUTES.clinicBilling)}
        />
        <SettingsShortcut
          danger
          description="Sign out of your clinic admin account."
          icon="support"
          label="Log Out"
          onPress={() => void signOut()}
        />
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

      <View style={styles.bottomNav}>
        <BottomNavItem
          icon="home"
          label="Dashboard"
          onPress={() => router.push(ROUTES.clinicHome)}
        />
        <BottomNavItem
          icon="user"
          label="Doctors"
          onPress={() => router.push(ROUTES.clinicDoctors)}
        />
        <BottomNavItem
          icon="location"
          label="Locations"
          onPress={() => router.push(ROUTES.clinicProfile)}
        />
        <BottomNavItem
          icon="calendar"
          label="Appointments"
          onPress={() => router.push(ROUTES.clinicAppointments)}
        />
        <BottomNavItem
          active
          icon="shield"
          label="Profile"
          onPress={() => router.push(ROUTES.clinicProfile)}
        />
      </View>
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

function SettingsShortcut({
  danger = false,
  description,
  icon,
  label,
  onPress
}: {
  danger?: boolean;
  description: string;
  icon: "bookmark" | "location" | "shield" | "support" | "user";
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.menuRow}>
      <View style={[styles.menuIconWrap, danger ? styles.menuIconDanger : null]}>
        <PatientGlyph
          color={danger ? "#D33C32" : colors.primary}
          name={icon}
          size={22}
        />
      </View>
      <View style={styles.menuCopy}>
        <Text style={[styles.menuLabel, danger ? styles.menuLabelDanger : null]}>
          {label}
        </Text>
        <Text style={styles.menuDescription}>{description}</Text>
      </View>
      <Text style={styles.menuArrow}>›</Text>
    </Pressable>
  );
}

function BottomNavItem({
  active = false,
  icon,
  label,
  onPress
}: {
  active?: boolean;
  icon: "home" | "user" | "location" | "calendar" | "shield";
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.bottomNavItem}>
      <PatientGlyph color={active ? colors.primary : "#6B7FA8"} name={icon} size={26} />
      <Text style={[styles.bottomNavLabel, active ? styles.bottomNavLabelActive : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: spacing["3xl"]
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  bellButton: {
    width: 52,
    height: 52,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "#E1ECF8",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    ...shadows.soft
  },
  bellDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary
  },
  header: {
    gap: spacing.sm
  },
  title: {
    color: colors.text,
    fontSize: 34,
    fontWeight: "900",
    lineHeight: 40
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 18,
    lineHeight: 24
  },
  summaryCard: {
    gap: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: "#E3EEF9",
    backgroundColor: colors.surface,
    padding: spacing.xl,
    ...shadows.card
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.lg
  },
  summaryIdentity: {
    flexDirection: "row",
    gap: spacing.lg,
    flex: 1
  },
  summaryLogo: {
    width: 112,
    height: 112,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceMuted
  },
  summaryLogoFallback: {
    alignItems: "center",
    justifyContent: "center",
    width: 112,
    height: 112,
    borderRadius: radius.xl,
    backgroundColor: colors.primarySoft
  },
  summaryCopy: {
    flex: 1,
    gap: spacing.sm,
    justifyContent: "center"
  },
  summaryTitle: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 32
  },
  summaryMeta: {
    color: colors.textMuted,
    fontSize: 17,
    lineHeight: 24
  },
  summaryFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#E8EFF7",
    paddingTop: spacing.lg
  },
  planPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: "#EAF8FA",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm
  },
  planPillText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "700"
  },
  menuCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: "#E3EEF9",
    backgroundColor: colors.surface,
    overflow: "hidden",
    ...shadows.card
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#E8EFF7"
  },
  menuIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: "#EEF8FB",
    alignItems: "center",
    justifyContent: "center"
  },
  menuIconDanger: {
    backgroundColor: "#FFF1F0"
  },
  menuCopy: {
    flex: 1,
    gap: spacing.xs
  },
  menuLabel: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  menuLabelDanger: {
    color: "#D33C32"
  },
  menuDescription: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 22
  },
  menuArrow: {
    color: "#6B7FA8",
    fontSize: 28,
    lineHeight: 28,
    marginTop: -2
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
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    minHeight: 92,
    borderRadius: 30,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "#E3EEF9",
    paddingHorizontal: spacing.sm,
    ...shadows.card
  },
  bottomNavItem: {
    alignItems: "center",
    gap: spacing.sm
  },
  bottomNavLabel: {
    color: "#6B7FA8",
    fontSize: 14,
    fontWeight: "500"
  },
  bottomNavLabelActive: {
    color: colors.primary
  }
});
