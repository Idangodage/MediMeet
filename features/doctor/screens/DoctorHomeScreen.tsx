import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

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
import { colors, radius, shadows, spacing, typography } from "@/constants/theme";
import { useAuth } from "@/features/auth";
import { NotificationSummaryCard } from "@/features/notifications";
import { PatientGlyph } from "@/features/patient/components/PatientGlyph";
import { PublicBrandLockup } from "@/features/public/components/PublicBrandLockup";
import { SubscriptionPlanCard } from "@/features/subscriptions";
import {
  calculateDoctorProfileCompletion,
  formatDoctorProfileStatus,
  getOwnDoctorProfile,
  type DoctorProfileStatus
} from "@/services/doctor.service";
import {
  formatDoctorLocation,
  getDoctorAppointmentDashboardData,
  trimAppointmentTime,
  type DoctorAppointment
} from "@/services/doctorAppointments.service";
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
  const firstName =
    profile?.fullName?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "Doctor";
  const nextAppointment =
    appointmentDashboardQuery.data?.today[0] ??
    appointmentDashboardQuery.data?.upcoming[0] ??
    null;
  const todaySchedule = appointmentDashboardQuery.data?.today.slice(0, 3) ?? [];

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

      <View style={styles.heroText}>
        <View style={styles.greetingRow}>
          <Text style={styles.greeting}>Good morning, {firstName}</Text>
          {completion.status === "verified" ? (
            <Badge label="Verified" variant="info" />
          ) : null}
        </View>
        <Text style={styles.subheading}>Here&apos;s your clinic overview for today.</Text>
      </View>

      {appointmentDashboardQuery.data ? (
        <View style={styles.metricsCard}>
          <HomeMetric
            actionLabel="View all"
            icon="calendar"
            label="Today's Appointments"
            onPress={() => router.push(ROUTES.doctorAppointments)}
            value={String(appointmentDashboardQuery.data.today.length)}
          />
          <HomeMetric
            actionLabel="View all"
            icon="bookmark"
            label="Pending Bookings"
            onPress={() => router.push(ROUTES.doctorAppointments)}
            value={String(appointmentDashboardQuery.data.requested.length)}
          />
          <HomeMetric
            actionLabel="Manage"
            icon="support"
            label="Available Slots"
            onPress={() => router.push(ROUTES.doctorAvailability)}
            value={String(appointmentDashboardQuery.data.analytics.activeAppointments)}
          />
          <HomeMetric
            actionLabel="View Profile"
            icon="shield"
            label="Profile & Verified"
            onPress={() => router.push(ROUTES.doctorProfile)}
            value={`${completion.percentage}%`}
          />
        </View>
      ) : null}

      {nextAppointment ? (
        <View style={styles.nextCard}>
          <View style={styles.nextIdentity}>
            <Avatar
              imageUrl={nextAppointment.patient?.fullName ? null : null}
              name={nextAppointment.patient?.fullName ?? "Patient"}
              size={74}
            />
            <View style={styles.nextCopy}>
              <Text style={styles.nextEyebrow}>Next Appointment</Text>
              <Text style={styles.nextName}>
                {nextAppointment.patient?.fullName ?? "Patient"}
              </Text>
              <Text style={styles.nextReason}>
                {nextAppointment.reasonForVisit || "Consultation"}
              </Text>
              <Text style={styles.nextMeta}>
                {trimAppointmentTime(nextAppointment.startTime)} -{" "}
                {formatDoctorLocation(nextAppointment.location)}
              </Text>
            </View>
          </View>
          <Button
            title="View details"
            variant="secondary"
            onPress={() =>
              router.push({
                pathname: "/doctor/appointments/[appointmentId]",
                params: { appointmentId: nextAppointment.id }
              })
            }
          />
        </View>
      ) : null}

      <View style={styles.quickActionsRow}>
        <DoctorQuickAction
          icon="user"
          label="Edit Profile"
          onPress={() => router.push(ROUTES.doctorProfile)}
        />
        <DoctorQuickAction
          icon="calendar"
          label="Add Availability"
          onPress={() => router.push(ROUTES.doctorAvailability)}
        />
        <DoctorQuickAction
          icon="bookmark"
          label="Appointments"
          onPress={() => router.push(ROUTES.doctorAppointments)}
        />
        <DoctorQuickAction
          icon="shield"
          label="Subscription"
          onPress={() => router.push(ROUTES.doctorBilling)}
        />
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

      {todaySchedule.length > 0 ? (
        <Card
          title="Today's Schedule"
          subtitle="Your nearest doctor-side appointment queue."
        >
          <View style={styles.scheduleList}>
            {todaySchedule.map((appointment) => (
              <ScheduleRow appointment={appointment} key={appointment.id} />
            ))}
          </View>
        </Card>
      ) : null}

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

      <View style={styles.bottomNav}>
        <DoctorBottomNavItem
          active
          icon="home"
          label="Dashboard"
          onPress={() => router.push(ROUTES.doctorHome)}
        />
        <DoctorBottomNavItem
          icon="calendar"
          label="Availability"
          onPress={() => router.push(ROUTES.doctorAvailability)}
        />
        <DoctorBottomNavItem
          icon="bookmark"
          label="Appointments"
          onPress={() => router.push(ROUTES.doctorAppointments)}
        />
        <DoctorBottomNavItem
          icon="shield"
          label="Subscription"
          onPress={() => router.push(ROUTES.doctorBilling)}
        />
        <DoctorBottomNavItem
          icon="user"
          label="Profile"
          onPress={() => router.push(ROUTES.doctorProfile)}
        />
      </View>

      <Button title="Sign out" variant="ghost" onPress={signOut} style={styles.signOutButton} />
    </Screen>
  );
}

function HomeMetric({
  actionLabel,
  icon,
  label,
  onPress,
  value
}: {
  actionLabel: string;
  icon: "calendar" | "bookmark" | "support" | "shield";
  label: string;
  onPress: () => void;
  value: string;
}) {
  return (
    <View style={styles.metricItem}>
      <View style={styles.metricIconCircle}>
        <PatientGlyph color={colors.primary} name={icon} size={24} />
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
      <Pressable accessibilityRole="button" onPress={onPress}>
        <Text style={styles.metricLink}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

function DoctorQuickAction({
  icon,
  label,
  onPress
}: {
  icon: "user" | "calendar" | "bookmark" | "shield";
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.quickActionCard}>
      <View style={styles.quickActionIcon}>
        <PatientGlyph color={colors.primary} name={icon} size={28} />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </Pressable>
  );
}

function ScheduleRow({ appointment }: { appointment: DoctorAppointment }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() =>
        router.push({
          pathname: "/doctor/appointments/[appointmentId]",
          params: { appointmentId: appointment.id }
        })
      }
      style={styles.scheduleRow}
    >
      <View style={styles.scheduleAvatar}>
        <Avatar name={appointment.patient?.fullName ?? "Patient"} size={54} />
      </View>
      <View style={styles.scheduleCopy}>
        <Text style={styles.scheduleName}>
          {appointment.patient?.fullName ?? "Patient"}
        </Text>
        <Text style={styles.scheduleReason}>
          {appointment.reasonForVisit || "Consultation"}
        </Text>
      </View>
      <View style={styles.scheduleMetaWrap}>
        <Text style={styles.scheduleTime}>{trimAppointmentTime(appointment.startTime)}</Text>
        <Badge label={formatDoctorProfileStatusForSchedule(appointment.status)} variant={getScheduleVariant(appointment.status)} />
      </View>
    </Pressable>
  );
}

function DoctorBottomNavItem({
  active = false,
  icon,
  label,
  onPress
}: {
  active?: boolean;
  icon: "home" | "calendar" | "bookmark" | "shield" | "user";
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

function formatDoctorProfileStatusForSchedule(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getScheduleVariant(
  value: string
): "success" | "neutral" | "warning" | "danger" {
  if (value === "completed") {
    return "success";
  }

  if (["cancelled", "cancelled_by_patient", "cancelled_by_doctor"].includes(value)) {
    return "danger";
  }

  if (["requested", "pending"].includes(value)) {
    return "warning";
  }

  return "neutral";
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
  heroText: {
    gap: spacing.sm,
    paddingTop: spacing.sm
  },
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flexWrap: "wrap"
  },
  greeting: {
    color: colors.text,
    fontSize: 34,
    fontWeight: "900",
    lineHeight: 40,
    flexShrink: 1
  },
  subheading: {
    color: colors.textMuted,
    fontSize: 18,
    lineHeight: 24
  },
  metricsCard: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#E3EEF9",
    backgroundColor: colors.surface,
    overflow: "hidden",
    ...shadows.card
  },
  metricItem: {
    width: "50%",
    minHeight: 164,
    padding: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#EAF0F6"
  },
  metricIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: "#F2FBFC",
    alignItems: "center",
    justifyContent: "center"
  },
  metricValue: {
    color: colors.text,
    fontSize: 32,
    fontWeight: "900"
  },
  metricLabel: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24,
    textAlign: "center"
  },
  metricLink: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "700"
  },
  nextCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.lg,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#BEEDEE",
    backgroundColor: "#F5FCFC",
    padding: spacing.xl,
    ...shadows.soft
  },
  nextIdentity: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    flex: 1
  },
  nextCopy: {
    flex: 1,
    gap: spacing.xs
  },
  nextEyebrow: {
    color: colors.primary,
    fontSize: typography.body,
    fontWeight: "700"
  },
  nextName: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900"
  },
  nextReason: {
    color: "#415877",
    fontSize: 18,
    fontWeight: "500"
  },
  nextMeta: {
    color: "#556E9B",
    fontSize: 16,
    lineHeight: 22
  },
  quickActionsRow: {
    flexDirection: "row",
    gap: spacing.md
  },
  quickActionCard: {
    flex: 1,
    minHeight: 138,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E3EEF9",
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.md,
    ...shadows.soft
  },
  quickActionIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: "#F7FBFF",
    alignItems: "center",
    justifyContent: "center"
  },
  quickActionLabel: {
    color: "#153067",
    fontSize: 16,
    textAlign: "center",
    fontWeight: "600"
  },
  header: {
    gap: spacing.lg,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.primaryTint,
    padding: spacing.xl,
    ...shadows.soft
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
  scheduleList: {
    gap: spacing.md
  },
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#E8EFF7",
    backgroundColor: colors.surface,
    padding: spacing.md
  },
  scheduleAvatar: {
    width: 54,
    height: 54
  },
  scheduleCopy: {
    flex: 1,
    gap: spacing.xs
  },
  scheduleName: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  scheduleReason: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 22
  },
  scheduleMetaWrap: {
    alignItems: "flex-end",
    gap: spacing.sm
  },
  scheduleTime: {
    color: "#29456F",
    fontSize: typography.body,
    fontWeight: "800"
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
  },
  signOutButton: {
    alignSelf: "center"
  }
});
