import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/Screen";
import { Avatar, Button, ErrorState, Input, LoadingState } from "@/components/ui";
import { fontStyles } from "@/constants/fonts";
import { ROUTES } from "@/constants/routes";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { useAuth } from "@/features/auth";
import { PatientGlyph } from "@/features/patient/components/PatientGlyph";
import { PublicBrandLockup } from "@/features/public/components/PublicBrandLockup";
import {
  patientProfileSettingsSchema,
  type PatientProfileSettingsFormValues
} from "@/features/patient/schemas/profileSettings.schemas";
import {
  getOwnPatientProfileSettings,
  updateOwnPatientProfileSettings
} from "@/services/patient.service";

export function PatientProfileSettingsScreen() {
  const { profile, refreshProfile, signOut, user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
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
      setIsEditing(false);
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

  const memberSince = useMemo(() => {
    const source = profile?.createdAt ?? user?.created_at;

    if (!source) {
      return "Member";
    }

    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      year: "numeric"
    }).format(new Date(source));
  }, [profile?.createdAt, user?.created_at]);

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

      <Text style={styles.pageTitle}>Profile & Settings</Text>

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
        <>
          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <View style={styles.profileIdentityRow}>
                <View style={styles.avatarWrap}>
                  <Avatar
                    imageUrl={profile?.avatarUrl}
                    name={profileQuery.data.fullName || profile?.fullName || "Patient"}
                    size={112}
                  />
                  <View style={styles.cameraBadge}>
                    <Text style={styles.cameraBadgeText}>+</Text>
                  </View>
                </View>

                <View style={styles.profileCopy}>
                  <Text style={styles.profileName}>
                    {profileQuery.data.fullName || profile?.fullName || "Patient"}
                  </Text>
                  <Text style={styles.profileLine}>{profileQuery.data.email}</Text>
                  <Text style={styles.profileLine}>{profileQuery.data.phone || "Add phone number"}</Text>
                </View>
              </View>

              <Pressable
                accessibilityRole="button"
                onPress={() => setIsEditing((current) => !current)}
                style={styles.editButton}
              >
                <Text style={styles.editButtonText}>{isEditing ? "Close" : "Edit"}</Text>
              </Pressable>
            </View>

            <View style={styles.profileFooter}>
              <View style={styles.memberBadge}>
                <PatientGlyph color={colors.primary} name="shield" size={20} />
                <Text style={styles.memberBadgeText}>CareLink Patient</Text>
              </View>
              <Text style={styles.memberSince}>Member since {memberSince}</Text>
            </View>
          </View>

          {isEditing ? (
            <View style={styles.editCard}>
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
                title="Save Profile"
                isLoading={updateMutation.isPending}
                onPress={handleSubmit((values) => updateMutation.mutate(values))}
              />
            </View>
          ) : null}

          <View style={styles.menuCard}>
            <SettingsRow
              description="Manage your personal information"
              icon="user"
              title="Personal Details"
              onPress={() => setIsEditing(true)}
            />
            <Divider />
            <SettingsRow
              description="View and manage your preferred doctors"
              icon="heart"
              title="Favourite Doctors"
              onPress={() => router.push(ROUTES.patientFavouriteDoctors)}
            />
            <Divider />
            <SettingsRow
              description="See your notifications and reminders"
              icon="bell"
              title="Notifications"
              onPress={() => router.push(ROUTES.notifications)}
            />
            <Divider />
            <SettingsRow
              description="Review doctors you have met before"
              icon="bookmark"
              title="Visited Doctors"
              onPress={() => router.push(ROUTES.patientVisitedDoctors)}
            />
            <Divider />
            <SettingsRow
              description="Read the privacy policy"
              icon="shield"
              title="Privacy & Security"
              onPress={() => router.push(ROUTES.privacy)}
            />
            <Divider />
            <SettingsRow
              description="View terms of service and policies"
              icon="support"
              title="Terms & Policies"
              onPress={() => router.push(ROUTES.terms)}
            />
            <Divider />
            <SettingsRow
              description="Sign out of your account"
              icon="support"
              title="Log Out"
              tone="danger"
              onPress={() => void signOut()}
            />
          </View>

          <View style={styles.bottomNav}>
            <BottomNavItem icon="home" label="Home" onPress={() => router.push(ROUTES.patientHome)} />
            <BottomNavItem icon="search" label="Search" onPress={() => router.push(ROUTES.doctors)} />
            <BottomNavItem icon="calendar" label="Appointments" onPress={() => router.push(ROUTES.patientAppointments)} />
            <BottomNavItem active icon="user" label="Profile" onPress={() => router.push(ROUTES.patientProfile)} />
          </View>
        </>
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

function SettingsRow({
  description,
  icon,
  onPress,
  title,
  tone = "default"
}: {
  description: string;
  icon: "user" | "heart" | "bell" | "bookmark" | "shield" | "support";
  onPress: () => void;
  title: string;
  tone?: "default" | "danger";
}) {
  const iconColor = tone === "danger" ? colors.danger : colors.primary;

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.settingsRow}>
      <View style={styles.settingsIconCircle}>
        <PatientGlyph color={iconColor} name={icon} size={26} />
      </View>
      <View style={styles.settingsCopy}>
        <Text style={[styles.settingsTitle, tone === "danger" ? styles.dangerText : null]}>
          {title}
        </Text>
        <Text style={styles.settingsDescription}>{description}</Text>
      </View>
      <Text style={styles.chevron}>{">"}</Text>
    </Pressable>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function BottomNavItem({
  active = false,
  icon,
  label,
  onPress
}: {
  active?: boolean;
  icon: "home" | "search" | "calendar" | "user";
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.bottomNavItem}>
      <PatientGlyph color={active ? colors.primary : "#6B7FA8"} name={icon} size={28} />
      <Text style={[styles.bottomNavLabel, active ? styles.bottomNavLabelActive : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg
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
    position: "relative"
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
  pageTitle: {
    color: "#0D2557",
    fontSize: 34,
    lineHeight: 40,
    ...fontStyles.extraBold
  },
  profileCard: {
    gap: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: "#E3EEF9",
    backgroundColor: colors.surface,
    padding: spacing.xl
  },
  profileHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.lg
  },
  profileIdentityRow: {
    flexDirection: "row",
    gap: spacing.lg,
    flex: 1
  },
  avatarWrap: {
    position: "relative"
  },
  cameraBadge: {
    position: "absolute",
    right: -2,
    bottom: 4,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center"
  },
  cameraBadgeText: {
    color: colors.white,
    fontSize: 22,
    lineHeight: 22,
    ...fontStyles.bold
  },
  profileCopy: {
    flex: 1,
    gap: spacing.sm,
    justifyContent: "center"
  },
  profileName: {
    color: "#0D2557",
    fontSize: 28,
    lineHeight: 32,
    ...fontStyles.extraBold
  },
  profileLine: {
    color: "#556E9B",
    fontSize: 17,
    lineHeight: 24,
    ...fontStyles.regular
  },
  editButton: {
    minWidth: 96,
    alignSelf: "flex-start",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#2D73E1",
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md
  },
  editButtonText: {
    color: "#2D73E1",
    fontSize: 16,
    ...fontStyles.bold
  },
  profileFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#E8EFF7",
    paddingTop: spacing.lg
  },
  memberBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: "#EAF8FA",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm
  },
  memberBadgeText: {
    color: colors.primary,
    fontSize: 16,
    ...fontStyles.bold
  },
  memberSince: {
    color: "#6B7FA8",
    fontSize: 16,
    ...fontStyles.medium
  },
  editCard: {
    gap: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#E3EEF9",
    backgroundColor: colors.surface,
    padding: spacing.xl
  },
  menuCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#E3EEF9",
    backgroundColor: colors.surface,
    overflow: "hidden"
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg
  },
  settingsIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: "#F5F9FF",
    alignItems: "center",
    justifyContent: "center"
  },
  settingsCopy: {
    flex: 1,
    gap: spacing.xs
  },
  settingsTitle: {
    color: "#102A35",
    fontSize: 18,
    ...fontStyles.bold
  },
  settingsDescription: {
    color: "#5F7480",
    fontSize: 16,
    lineHeight: 24,
    ...fontStyles.regular
  },
  chevron: {
    color: "#102A35",
    fontSize: 22,
    ...fontStyles.medium
  },
  divider: {
    height: 1,
    backgroundColor: "#E8EFF7"
  },
  dangerText: {
    color: colors.danger
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    minHeight: 92,
    borderRadius: 30,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "#E3EEF9"
  },
  bottomNavItem: {
    alignItems: "center",
    gap: spacing.sm
  },
  bottomNavLabel: {
    color: "#6B7FA8",
    fontSize: 14,
    ...fontStyles.medium
  },
  bottomNavLabelActive: {
    color: colors.primary
  }
});
