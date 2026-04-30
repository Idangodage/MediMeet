import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
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
import { colors, radius, spacing, typography } from "@/constants/theme";
import {
  formatAdminRole,
  listAdminUsers,
  moderateDoctorProfile,
  type AdminRoleFilter,
  type AdminUser,
  type AdminVerificationStatus
} from "@/services/admin.service";
import { formatVerificationStatus } from "@/services/verification.service";
import type { AuthenticatedRole } from "@/types/roles";

const ROLE_FILTERS: AdminRoleFilter[] = [
  "all",
  "patient",
  "doctor",
  "clinic_admin",
  "platform_admin"
];

export function AdminUsersScreen() {
  const queryClient = useQueryClient();
  const [roleFilter, setRoleFilter] = useState<AdminRoleFilter>("all");
  const [moderationNote, setModerationNote] = useState("");
  const usersQuery = useQuery({
    queryKey: ["admin-users", roleFilter],
    queryFn: () => listAdminUsers(roleFilter)
  });
  const moderationMutation = useMutation({
    mutationFn: moderateDoctorProfile,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-dashboard-overview"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-verification-requests"] })
      ]);
      Alert.alert("Profile updated", "Doctor moderation settings were saved.");
    },
    onError: (error) => {
      Alert.alert(
        "Update failed",
        error instanceof Error ? error.message : "Unable to moderate profile."
      );
    }
  });

  const moderateDoctor = (
    user: AdminUser,
    values: {
      isPublic?: boolean | null;
      verificationStatus?: AdminVerificationStatus | null;
    }
  ) => {
    if (!user.doctorProfile) {
      return;
    }

    moderationMutation.mutate({
      doctorId: user.doctorProfile.id,
      note: moderationNote,
      ...values
    });
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Platform users</Text>
        <Text style={styles.title}>User directory</Text>
        <Text style={styles.subtitle}>
          View all user roles, inspect doctor moderation state, and act on public
          doctor visibility.
        </Text>
      </View>

      <Card title="Filters" subtitle="Filter accounts by assigned application role.">
        <View style={styles.filterRow}>
          {ROLE_FILTERS.map((role) => (
            <FilterPill
              isActive={roleFilter === role}
              key={role}
              label={role === "all" ? "All" : formatAdminRole(role)}
              onPress={() => setRoleFilter(role)}
            />
          ))}
        </View>
        <Input
          label="Moderation note"
          onChangeText={setModerationNote}
          placeholder="Optional note stored in audit metadata"
          value={moderationNote}
        />
      </Card>

      {usersQuery.isLoading ? <LoadingState message="Loading users..." /> : null}

      {usersQuery.isError ? (
        <ErrorState
          message={
            usersQuery.error instanceof Error
              ? usersQuery.error.message
              : "Unable to load users."
          }
          onRetry={() => void usersQuery.refetch()}
        />
      ) : null}

      {usersQuery.data?.length === 0 ? (
        <Card>
          <EmptyState
            title="No users found"
            message="Try a different role filter."
          />
        </Card>
      ) : null}

      {usersQuery.data?.map((user) => (
        <UserCard
          isSaving={moderationMutation.isPending}
          key={user.id}
          onModerate={(values) => moderateDoctor(user, values)}
          user={user}
        />
      ))}
    </Screen>
  );
}

function UserCard({
  isSaving,
  onModerate,
  user
}: {
  isSaving: boolean;
  onModerate: (values: {
    isPublic?: boolean | null;
    verificationStatus?: AdminVerificationStatus | null;
  }) => void;
  user: AdminUser;
}) {
  const doctor = user.doctorProfile;

  return (
    <Card>
      <View style={styles.userHeader}>
        <Avatar imageUrl={user.avatarUrl} name={user.fullName ?? user.email ?? "User"} size={56} />
        <View style={styles.userCopy}>
          <Text style={styles.rowTitle}>{user.fullName ?? "Unnamed user"}</Text>
          <Text style={styles.bodyText}>{user.email ?? "No email on profile"}</Text>
        </View>
        <Badge label={formatAdminRole(user.role)} variant={getRoleVariant(user.role)} />
      </View>

      <View style={styles.infoGrid}>
        <Info label="Phone" value={user.phone ?? "Not added"} />
        <Info label="Joined" value={formatDate(user.createdAt)} />
        <Info label="Patient city" value={user.patientCity ?? "Not applicable"} />
        <Info
          label="Clinic access"
          value={`${user.clinicMembershipCount} clinic${user.clinicMembershipCount === 1 ? "" : "s"}`}
        />
      </View>

      {doctor ? (
        <View style={styles.doctorBox}>
          <View style={styles.userHeader}>
            <View style={styles.userCopy}>
              <Text style={styles.rowTitle}>Doctor profile</Text>
              <Text style={styles.bodyText}>
                {doctor.specialties.join(", ") || "No specialty listed"}
              </Text>
            </View>
            <Badge
              label={formatVerificationStatus(doctor.verificationStatus)}
              variant={getVerificationVariant(doctor.verificationStatus)}
            />
            <Badge
              label={doctor.isPublic ? "Public" : "Hidden"}
              variant={doctor.isPublic ? "success" : "neutral"}
            />
          </View>

          <View style={styles.actionGrid}>
            <Button
              title="Review profile"
              variant="secondary"
              onPress={() => router.push(`/admin/verifications/${doctor.id}`)}
            />
            <Button
              title="Publish verified"
              disabled={isSaving}
              onPress={() =>
                onModerate({ verificationStatus: "approved", isPublic: true })
              }
            />
            <Button
              title="Hide profile"
              disabled={isSaving || !doctor.isPublic}
              variant="secondary"
              onPress={() => onModerate({ isPublic: false })}
            />
            <Button
              title="Suspend doctor"
              disabled={isSaving}
              variant="danger"
              onPress={() =>
                Alert.alert(
                  "Suspend doctor profile?",
                  "This hides the public profile and marks verification as suspended.",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Suspend",
                      style: "destructive",
                      onPress: () =>
                        onModerate({
                          verificationStatus: "suspended",
                          isPublic: false
                        })
                    }
                  ]
                )
              }
            />
          </View>
        </View>
      ) : null}
    </Card>
  );
}

function FilterPill({
  isActive,
  label,
  onPress
}: {
  isActive: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.filterPill, isActive ? styles.filterPillActive : null]}
    >
      <Text style={[styles.filterText, isActive ? styles.filterTextActive : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoItem}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function getRoleVariant(role: AuthenticatedRole) {
  if (role === "platform_admin") {
    return "danger";
  }

  if (role === "doctor") {
    return "success";
  }

  if (role === "clinic_admin") {
    return "warning";
  }

  return "neutral";
}

function getVerificationVariant(status: AdminVerificationStatus) {
  if (status === "approved") {
    return "success";
  }

  if (status === "rejected" || status === "suspended") {
    return "danger";
  }

  if (status === "needs_review") {
    return "warning";
  }

  return "neutral";
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium"
  }).format(new Date(value));
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
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  filterPill: {
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  filterPillActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft
  },
  filterText: {
    color: colors.textMuted,
    fontSize: typography.small,
    fontWeight: "800"
  },
  filterTextActive: {
    color: colors.primaryDark
  },
  userHeader: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  userCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 160
  },
  rowTitle: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: "900"
  },
  bodyText: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  infoItem: {
    minWidth: "45%",
    flex: 1,
    gap: spacing.xs
  },
  infoLabel: {
    color: colors.textMuted,
    fontSize: typography.small,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  infoValue: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "800"
  },
  doctorBox: {
    gap: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.md
  },
  actionGrid: {
    gap: spacing.sm
  }
});
