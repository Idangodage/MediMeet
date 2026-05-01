import { router } from "expo-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

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
import { colors, radius, shadows, spacing, typography } from "@/constants/theme";
import { PatientGlyph } from "@/features/patient/components/PatientGlyph";
import { PublicBrandLockup } from "@/features/public/components/PublicBrandLockup";
import {
  clinicDoctorInviteSchema,
  type ClinicDoctorInviteFormValues
} from "@/features/clinic/schemas/clinic.schemas";
import {
  getClinicWorkspace,
  inviteDoctorToClinic,
  updateClinicDoctorMembershipStatus,
  type ClinicDoctor,
  type MembershipStatus
} from "@/services/clinic.service";

const clinicWorkspaceQueryKey = ["clinic-workspace"];

export function ClinicDoctorsScreen() {
  const queryClient = useQueryClient();
  const [activeStatus, setActiveStatus] = useState<"all" | "verified" | "pending" | "active">("all");
  const workspaceQuery = useQuery({
    queryKey: clinicWorkspaceQueryKey,
    queryFn: getClinicWorkspace
  });
  const filteredDoctors = (workspaceQuery.data?.doctors ?? []).filter((doctor) => {
    if (activeStatus === "all") {
      return true;
    }

    if (activeStatus === "verified") {
      return doctor.verificationStatus === "approved";
    }

    if (activeStatus === "pending") {
      return doctor.status === "pending";
    }

    return doctor.status === "active";
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
        <Text style={styles.title}>Doctors</Text>
        <Text style={styles.subtitle}>
          Manage your clinic doctors and availability.
        </Text>
      </View>

      {workspaceQuery.isLoading ? (
        <LoadingState message="Loading clinic doctors..." />
      ) : null}

      {workspaceQuery.isError ? (
        <ErrorState
          message={
            workspaceQuery.error instanceof Error
              ? workspaceQuery.error.message
              : "Unable to load clinic doctors."
          }
          onRetry={() => void workspaceQuery.refetch()}
        />
      ) : null}

      {workspaceQuery.data ? (
        <>
          {!workspaceQuery.data.clinic ? (
            <Card>
              <EmptyState
                title="Create clinic profile first"
                message="Doctor invitations require an active clinic profile."
              />
            </Card>
          ) : null}

          {workspaceQuery.data.clinic ? (
            <>
              <View style={styles.toolbarCard}>
                <View style={styles.clinicHeaderRow}>
                  <View style={styles.clinicNamePill}>
                    <PatientGlyph name="location" color={colors.primary} size={20} />
                    <Text style={styles.clinicNameText}>
                      {workspaceQuery.data.clinic.name}
                    </Text>
                  </View>
                  <View style={styles.countPill}>
                    <Text style={styles.countPillText}>
                      {workspaceQuery.data.doctors.length} doctors
                    </Text>
                  </View>
                </View>

                <View style={styles.searchInviteRow}>
                  <View style={styles.searchBar}>
                    <PatientGlyph name="search" color="#7B8F99" />
                    <Text style={styles.searchPlaceholder}>
                      Search doctors by name or specialty...
                    </Text>
                  </View>
                  <Button
                    title="+ Add Doctor"
                    onPress={() =>
                      Alert.alert(
                        "Invite a doctor",
                        "Use the invite doctor form below to add a doctor to your clinic."
                      )
                    }
                    style={styles.addDoctorButton}
                  />
                </View>

                <View style={styles.filterChips}>
                  {[
                    { key: "all", label: "All" },
                    { key: "verified", label: "Verified" },
                    { key: "pending", label: "Pending" },
                    { key: "active", label: "Active" }
                  ].map((item) => (
                    <Button
                      key={item.key}
                      title={item.label}
                      variant={activeStatus === item.key ? "primary" : "secondary"}
                      onPress={() =>
                        setActiveStatus(item.key as "all" | "verified" | "pending" | "active")
                      }
                    />
                  ))}
                </View>
              </View>

              <InviteDoctorCard
                disabled={
                  workspaceQuery.data.doctors.filter((doctor) =>
                    ["active", "pending"].includes(doctor.status)
                  ).length >= 1 && !workspaceQuery.data.canUseFullClinicDashboard
                }
                onRefresh={async () => {
                  await queryClient.invalidateQueries({
                    queryKey: clinicWorkspaceQueryKey
                  });
                }}
              />
            </>
          ) : null}

          {filteredDoctors.length > 0 ? (
            <View style={styles.list}>
              {filteredDoctors.map((doctor) => (
                <DoctorMembershipCard
                  key={doctor.id}
                  doctor={doctor}
                  onRefresh={async () => {
                    await queryClient.invalidateQueries({
                      queryKey: clinicWorkspaceQueryKey
                    });
                  }}
                />
              ))}
            </View>
          ) : (
            <Card>
              <EmptyState
                title="No clinic doctors"
                message="Invite a doctor by account email or registration number."
              />
            </Card>
          )}
        </>
      ) : null}

      <View style={styles.bottomNav}>
        <BottomNavItem
          icon="home"
          label="Dashboard"
          onPress={() => router.push(ROUTES.clinicHome)}
        />
        <BottomNavItem
          active
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
          icon="shield"
          label="Profile"
          onPress={() => router.push(ROUTES.clinicProfile)}
        />
      </View>
    </Screen>
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

function InviteDoctorCard({
  disabled,
  onRefresh
}: {
  disabled: boolean;
  onRefresh: () => Promise<void>;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ClinicDoctorInviteFormValues>({
    resolver: zodResolver(clinicDoctorInviteSchema),
    defaultValues: {
      email: "",
      registrationNumber: ""
    }
  });
  const inviteMutation = useMutation({
    mutationFn: inviteDoctorToClinic,
    onSuccess: async () => {
      reset();
      await onRefresh();
      Alert.alert("Invitation sent", "Doctor membership was created as pending.");
    },
    onError: (error) => {
      setFormError(
        error instanceof Error ? error.message : "Unable to invite doctor."
      );
    }
  });
  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    inviteMutation.mutate(values);
  });

  return (
    <Card
      title="Invite doctor"
      subtitle="Use the doctor account email or registration number. Additional doctors require the Clinic Plan."
    >
      {disabled ? (
        <View style={styles.warningBox}>
          <Badge label="Clinic Plan required" variant="warning" />
          <Text style={styles.bodyText}>
            Your clinic already has one doctor. Upgrade before inviting more.
          </Text>
        </View>
      ) : null}
      {formError ? <ErrorState message={formError} /> : null}

      <Controller
        control={control}
        name="email"
        render={({ field: { onBlur, onChange, value } }) => (
          <Input
            error={errors.email?.message}
            keyboardType="email-address"
            label="Doctor email"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value ?? ""}
          />
        )}
      />
      <Controller
        control={control}
        name="registrationNumber"
        render={({ field: { onBlur, onChange, value } }) => (
          <Input
            error={errors.registrationNumber?.message}
            label="Registration number"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value ?? ""}
          />
        )}
      />
      <Button
        title="Invite doctor"
        disabled={disabled}
        isLoading={isSubmitting || inviteMutation.isPending}
        onPress={onSubmit}
      />
    </Card>
  );
}

function DoctorMembershipCard({
  doctor,
  onRefresh
}: {
  doctor: ClinicDoctor;
  onRefresh: () => Promise<void>;
}) {
  const statusMutation = useMutation({
    mutationFn: (status: MembershipStatus) =>
      updateClinicDoctorMembershipStatus({
        membershipId: doctor.id,
        status
      }),
    onSuccess: onRefresh,
    onError: (error) => {
      Alert.alert(
        "Unable to update doctor",
        error instanceof Error ? error.message : "Membership update failed."
      );
    }
  });

  return (
    <Card>
      <View style={styles.doctorHeader}>
        <Avatar imageUrl={doctor.profileImageUrl} name={doctor.fullName} />
        <View style={styles.doctorCopy}>
          <Text style={styles.doctorName}>
            {[doctor.title, doctor.fullName].filter(Boolean).join(" ")}
          </Text>
          <Text style={styles.bodyText}>
            {doctor.specialties.join(", ") || "Specialty unavailable"}
          </Text>
          <Text style={styles.metaText}>
            Reg. {doctor.registrationNumber} | {doctor.yearsOfExperience} years
          </Text>
        </View>
        <Badge label={formatStatus(doctor.status)} variant={getStatusVariant(doctor.status)} />
      </View>

      <View style={styles.actionRow}>
        <Button
          title="Activate"
          variant="secondary"
          disabled={doctor.status === "active"}
          isLoading={statusMutation.isPending}
          onPress={() => statusMutation.mutate("active")}
        />
        <Button
          title="Suspend"
          variant="secondary"
          disabled={doctor.status === "suspended"}
          isLoading={statusMutation.isPending}
          onPress={() => statusMutation.mutate("suspended")}
        />
        <Button
          title="Remove"
          variant="danger"
          disabled={doctor.status === "removed"}
          isLoading={statusMutation.isPending}
          onPress={() => statusMutation.mutate("removed")}
        />
      </View>
    </Card>
  );
}

function formatStatus(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getStatusVariant(status: MembershipStatus) {
  if (status === "active") {
    return "success";
  }

  if (status === "pending") {
    return "warning";
  }

  if (status === "removed" || status === "suspended") {
    return "danger";
  }

  return "neutral";
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
  toolbarCard: {
    gap: spacing.md,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#E3EEF9",
    backgroundColor: colors.surface,
    padding: spacing.lg,
    ...shadows.card
  },
  clinicHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md
  },
  clinicNamePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E3EEF9",
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md
  },
  clinicNameText: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "600"
  },
  countPill: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E3EEF9",
    backgroundColor: "#F9FBFF",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md
  },
  countPillText: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: "600"
  },
  searchInviteRow: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center"
  },
  searchBar: {
    flex: 1,
    minHeight: 64,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#DDEAF4",
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg
  },
  searchPlaceholder: {
    color: "#7B8F99",
    fontSize: 17,
    fontWeight: "500"
  },
  addDoctorButton: {
    minWidth: 150,
    minHeight: 64
  },
  filterChips: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap"
  },
  list: {
    gap: spacing.lg
  },
  warningBox: {
    gap: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.warningSoft,
    padding: spacing.md
  },
  doctorHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md
  },
  doctorCopy: {
    flex: 1,
    gap: spacing.xs
  },
  doctorName: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: "900"
  },
  bodyText: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24
  },
  metaText: {
    color: colors.textMuted,
    fontSize: typography.small,
    fontWeight: "800"
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
