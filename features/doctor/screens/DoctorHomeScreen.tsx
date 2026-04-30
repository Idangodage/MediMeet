import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/Screen";
import {
  Avatar,
  Badge,
  Button,
  Card,
  ErrorState,
  LoadingState
} from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { useAuth } from "@/features/auth";
import { NotificationSummaryCard } from "@/features/notifications";
import { SubscriptionPlanCard } from "@/features/subscriptions";
import {
  calculateDoctorProfileCompletion,
  formatDoctorProfileStatus,
  getOwnDoctorProfile,
  type DoctorProfileStatus
} from "@/services/doctor.service";
import { getDoctorAppointmentDashboardData } from "@/services/doctorAppointments.service";
import {
  formatRating,
  listOwnDoctorReviews,
  type DoctorReview
} from "@/services/review.service";

export function DoctorHomeScreen() {
  const { profile, signOut, user } = useAuth();
  const doctorProfileQuery = useQuery({
    queryKey: ["own-doctor-profile"],
    queryFn: getOwnDoctorProfile
  });
  const appointmentDashboardQuery = useQuery({
    queryKey: ["doctor-home-dashboard"],
    queryFn: getDoctorAppointmentDashboardData
  });
  const reviewsQuery = useQuery({
    queryKey: ["own-doctor-reviews"],
    queryFn: listOwnDoctorReviews
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
            <Text style={styles.subtitle}>
              Manage profile readiness, appointments, patients, and practice growth.
            </Text>
          </View>
        </View>
        <Badge label="Doctor" variant="primary" />
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
          {completion.status === "pending_verification" ? (
            <View style={styles.infoBox}>
              <Badge label="Under verification" variant="info" />
              <Text style={styles.bodyText}>
                Your profile is under verification. You can prepare your
                calendar while waiting.
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
            <Button
              title="Availability calendar"
              variant="secondary"
              onPress={() => router.push(ROUTES.doctorAvailability)}
            />
            <Button
              title="Billing"
              variant="secondary"
              onPress={() => router.push(ROUTES.doctorBilling)}
            />
          </View>
        </Card>
      )}

      <SubscriptionPlanCard scope="doctor" />

      <NotificationSummaryCard
        title="Recent notifications"
        subtitle="New patient bookings, verification updates, and billing notices appear here."
      />

      <Card
        title="Patient reviews"
        subtitle="Read-only feedback from completed appointments."
      >
        {reviewsQuery.isLoading ? (
          <LoadingState message="Loading reviews..." />
        ) : null}
        {reviewsQuery.isError ? (
          <ErrorState
            message={
              reviewsQuery.error instanceof Error
                ? reviewsQuery.error.message
                : "Unable to load reviews."
            }
            onRetry={() => void reviewsQuery.refetch()}
          />
        ) : null}
        {reviewsQuery.data?.length ? (
          reviewsQuery.data.slice(0, 4).map((review) => (
            <DoctorReviewCard key={review.id} review={review} />
          ))
        ) : !reviewsQuery.isLoading && !reviewsQuery.isError ? (
          <Text style={styles.bodyText}>No reviews yet.</Text>
        ) : null}
      </Card>

      <Card
        title="Appointment operations"
        subtitle="Manage today's work, pending requests, outcomes, and treated patients."
      >
        {appointmentDashboardQuery.isLoading ? (
          <LoadingState message="Loading appointment summary..." />
        ) : null}

        {appointmentDashboardQuery.isError ? (
          <ErrorState
            message={
              appointmentDashboardQuery.error instanceof Error
                ? appointmentDashboardQuery.error.message
                : "Unable to load appointment summary."
            }
            onRetry={() => void appointmentDashboardQuery.refetch()}
          />
        ) : null}

        {appointmentDashboardQuery.data ? (
          <>
            <View style={styles.statsRow}>
              <SummaryStat
                label="Today"
                value={String(appointmentDashboardQuery.data.today.length)}
              />
              <SummaryStat
                label="Upcoming"
                value={String(appointmentDashboardQuery.data.upcoming.length)}
              />
              <SummaryStat
                label="Requested"
                value={String(appointmentDashboardQuery.data.requested.length)}
              />
            </View>
            <View style={styles.statsRow}>
              <SummaryStat
                label="Completed"
                value={String(appointmentDashboardQuery.data.completed.length)}
              />
              <SummaryStat
                label="Cancelled"
                value={String(appointmentDashboardQuery.data.cancelled.length)}
              />
              <SummaryStat
                label="No-show"
                value={String(appointmentDashboardQuery.data.noShow.length)}
              />
            </View>
            <View style={styles.actionRow}>
              <Button
                title="Open appointment dashboard"
                onPress={() => router.push(ROUTES.doctorAppointments)}
              />
              <Button
                title="Treated patients"
                variant="secondary"
                onPress={() => router.push(ROUTES.doctorPatients)}
              />
            </View>
          </>
        ) : null}
      </Card>

      <Button title="Sign out" variant="ghost" onPress={signOut} />
    </Screen>
  );
}

function DoctorReviewCard({ review }: { review: DoctorReview }) {
  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Badge label={formatRating(review.rating)} variant="success" />
        <Badge
          label={review.isPublic ? "Public" : "Private/hidden"}
          variant={review.isPublic ? "success" : "neutral"}
        />
      </View>
      <Text style={styles.bodyText}>
        {review.comment || "No written comment."}
      </Text>
      <Text style={styles.reviewMeta}>
        {review.patientName ?? "Patient"} - {formatDate(review.createdAt)}
      </Text>
    </View>
  );
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

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryStat}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium"
  }).format(new Date(value));
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.lg,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.primaryTint,
    padding: spacing.xl
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
    fontWeight: "900",
    letterSpacing: -0.5
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 23,
    marginTop: spacing.xs
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
    borderWidth: 1,
    borderColor: colors.warningSoft,
    backgroundColor: colors.warningSoft,
    padding: spacing.md
  },
  infoBox: {
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.infoSoft,
    backgroundColor: colors.infoSoft,
    padding: spacing.md
  },
  bodyText: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24
  },
  actionRow: {
    gap: spacing.sm
  },
  reviewCard: {
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.primaryTint,
    padding: spacing.md
  },
  reviewHeader: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  reviewMeta: {
    color: colors.textMuted,
    fontSize: typography.small,
    fontWeight: "800"
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.md
  },
  summaryStat: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.primaryTint,
    padding: spacing.md
  },
  summaryValue: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "900"
  },
  summaryLabel: {
    color: colors.textMuted,
    fontSize: typography.small,
    fontWeight: "800"
  },
});
