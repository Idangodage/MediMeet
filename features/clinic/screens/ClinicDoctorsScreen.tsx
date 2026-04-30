import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, StyleSheet, Text, View } from "react-native";

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
import { colors, radius, spacing, typography } from "@/constants/theme";
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
  const workspaceQuery = useQuery({
    queryKey: clinicWorkspaceQueryKey,
    queryFn: getClinicWorkspace
  });

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Clinic doctors</Text>
        <Text style={styles.title}>Manage connected doctors</Text>
        <Text style={styles.subtitle}>
          Doctors can belong to multiple clinics. This screen only manages
          memberships for the clinic linked to your admin account.
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
          ) : null}

          {workspaceQuery.data.doctors.length > 0 ? (
            <View style={styles.list}>
              {workspaceQuery.data.doctors.map((doctor) => (
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
    </Screen>
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
            Reg. {doctor.registrationNumber} · {doctor.yearsOfExperience} years
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
  }
});
