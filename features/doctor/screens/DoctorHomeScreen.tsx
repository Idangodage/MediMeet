import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/Screen";
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState
} from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { useAuth } from "@/features/auth";
import {
  calculateDoctorProfileCompletion,
  formatDoctorProfileStatus,
  getOwnDoctorProfile,
  type DoctorProfileStatus
} from "@/services/doctor.service";

export function DoctorHomeScreen() {
  const { profile, signOut, user } = useAuth();
  const doctorProfileQuery = useQuery({
    queryKey: ["own-doctor-profile"],
    queryFn: getOwnDoctorProfile
  });
  const completion = calculateDoctorProfileCompletion(doctorProfileQuery.data ?? null);

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.identity}>
          <Avatar
            imageUrl={profile?.avatarUrl}
            name={profile?.fullName ?? user?.email}
          />
          <View style={styles.identityText}>
            <Text style={styles.eyebrow}>Doctor workspace</Text>
            <Text style={styles.title}>
              {profile?.fullName ?? user?.email ?? "Doctor"}
            </Text>
          </View>
        </View>
        <Badge label="Doctor" />
      </View>

      {doctorProfileQuery.isLoading ? (
        <LoadingState message="Loading profile status..." />
      ) : doctorProfileQuery.isError ? (
        <ErrorState
          message={
            doctorProfileQuery.error instanceof Error
              ? doctorProfileQuery.error.message
              : "Unable to load your doctor profile status."
          }
          onRetry={() => void doctorProfileQuery.refetch()}
        />
      ) : (
        <Card
          title="Profile readiness"
          subtitle="Public discovery requires a complete, verified, public profile."
        >
          <View style={styles.profileStatusHeader}>
            <Text style={styles.completionValue}>{completion.percentage}%</Text>
            <Badge
              label={formatDoctorProfileStatus(completion.status)}
              variant={getStatusBadgeVariant(completion.status)}
            />
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${completion.percentage}%` }]} />
          </View>
          {completion.status !== "verified" ? (
            <View style={styles.warningBox}>
              <Badge label="Not public yet" variant="warning" />
              <Text style={styles.bodyText}>
                Your profile stays hidden from public search until verification is
                approved and platform visibility is enabled.
              </Text>
            </View>
          ) : null}
          <View style={styles.actionRow}>
            <Button
              title="Manage profile"
              onPress={() => router.push(ROUTES.doctorProfile)}
            />
            <Button
              title="Preview public profile"
              variant="secondary"
              onPress={() => router.push(ROUTES.doctorProfilePreview)}
            />
            <Button
              title="Verification documents"
              variant="secondary"
              onPress={() => router.push(ROUTES.doctorVerification)}
            />
          </View>
        </Card>
      )}

      <Card title="Practice operations" subtitle="Clinical schedule tools will live here.">
        <EmptyState
          title="Doctor tools pending"
          message="The doctor feature boundary is ready for availability, appointment, and patient workflow modules."
        />
      </Card>

      <Button title="Sign out" variant="ghost" onPress={signOut} />
    </Screen>
  );
}

function getStatusBadgeVariant(status: DoctorProfileStatus) {
  if (status === "verified") {
    return "success";
  }

  if (status === "rejected") {
    return "danger";
  }

  if (status === "incomplete" || status === "needs_update") {
    return "warning";
  }

  return "neutral";
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.lg
  },
  identity: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md
  },
  identityText: {
    flex: 1
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
  profileStatusHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  completionValue: {
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
    backgroundColor: colors.primary
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
  actionRow: {
    gap: spacing.sm
  }
});
