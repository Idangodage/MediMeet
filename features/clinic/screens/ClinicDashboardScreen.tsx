import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/Screen";
import {
  Badge,
  Button,
  Card,
  EmptyState,
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
import { getClinicWorkspace } from "@/services/clinic.service";

export function ClinicDashboardScreen() {
  const { profile, signOut, user } = useAuth();
  const workspaceQuery = useQuery({
    queryKey: ["clinic-workspace"],
    queryFn: getClinicWorkspace
  });
  const firstName =
    profile?.fullName?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "there";
  const nextAppointment = workspaceQuery.data?.appointments[0] ?? null;
  const todaySchedule = (workspaceQuery.data?.appointments ?? []).slice(0, 3);

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
        <Text style={styles.title}>Good morning, {firstName}</Text>
        <Text style={styles.subtitle}>Here&apos;s your clinic overview for today.</Text>
      </View>

      <View style={styles.clinicSelector}>
        <PatientGlyph name="location" color={colors.primary} size={22} />
        <Text style={styles.clinicSelectorText}>
          {workspaceQuery.data?.clinic?.name ?? "Create clinic profile"}
        </Text>
      </View>

      {workspaceQuery.isLoading ? (
        <LoadingState message="Loading clinic workspace..." />
      ) : null}

      {workspaceQuery.isError ? (
        <ErrorState
          message={
            workspaceQuery.error instanceof Error
              ? workspaceQuery.error.message
              : "Unable to load clinic workspace."
          }
          onRetry={() => void workspaceQuery.refetch()}
        />
      ) : null}

      {workspaceQuery.data?.clinic ? (
        <>
          <View style={styles.metricsCard}>
            <ClinicMetric
              actionLabel="View all"
              icon="calendar"
              label="Today's Appointments"
              onPress={() => router.push(ROUTES.clinicAppointments)}
              value={String(workspaceQuery.data.analytics.upcomingAppointments)}
            />
            <ClinicMetric
              actionLabel="Manage"
              icon="user"
              label="Active Doctors"
              onPress={() => router.push(ROUTES.clinicDoctors)}
              value={String(workspaceQuery.data.doctors.length)}
            />
            <ClinicMetric
              actionLabel="View all"
              icon="location"
              label="Locations"
              onPress={() => router.push(ROUTES.clinicProfile)}
              value={String(workspaceQuery.data.locations.length)}
            />
            <ClinicMetric
              actionLabel="View Insights"
              icon="bookmark"
              label="Booking Rate"
              onPress={() => router.push(ROUTES.clinicAnalytics)}
              value={`${workspaceQuery.data.analytics.completionRate}%`}
            />
          </View>

          {nextAppointment ? (
            <View style={styles.nextCard}>
              <View style={styles.nextIdentity}>
                <View style={styles.nextAvatarWrap}>
                  <PatientGlyph name="user" color={colors.primary} size={28} />
                </View>
                <View style={styles.nextCopy}>
                  <Text style={styles.nextEyebrow}>Next Appointment</Text>
                  <Text style={styles.nextName}>{nextAppointment.patientName}</Text>
                  <Text style={styles.nextReason}>
                    {nextAppointment.reasonForVisit || "Consultation"}
                  </Text>
                  <Text style={styles.nextMeta}>
                    {nextAppointment.doctor?.fullName ?? "Doctor"} |{" "}
                    {nextAppointment.startTime.slice(0, 5)} |{" "}
                    {nextAppointment.location?.name ?? "Main branch"}
                  </Text>
                </View>
              </View>
              <Button
                title="View Details"
                variant="secondary"
                onPress={() => router.push(ROUTES.clinicAppointments)}
              />
            </View>
          ) : null}

          <View style={styles.quickActionsRow}>
            <QuickAction
              icon="user"
              label="Manage Doctors"
              onPress={() => router.push(ROUTES.clinicDoctors)}
            />
            <QuickAction
              icon="location"
              label="Add Location"
              onPress={() => router.push(ROUTES.clinicProfile)}
            />
            <QuickAction
              icon="calendar"
              label="Appointments"
              onPress={() => router.push(ROUTES.clinicAppointments)}
            />
            <QuickAction
              icon="shield"
              label="Billing"
              onPress={() => router.push(ROUTES.clinicBilling)}
            />
          </View>

          {todaySchedule.length > 0 ? (
            <Card
              title="Today's Schedule"
              subtitle="Your nearest clinic-wide appointment queue."
            >
              <View style={styles.scheduleList}>
                {todaySchedule.map((appointment) => (
                  <ScheduleRow
                    key={appointment.id}
                    doctorName={appointment.doctor?.fullName ?? "Doctor"}
                    patientName={appointment.patientName}
                    reason={appointment.reasonForVisit || "Consultation"}
                    status={appointment.status}
                    time={appointment.startTime.slice(0, 5)}
                  />
                ))}
              </View>
            </Card>
          ) : null}

          <Card
            title="Clinic Insights"
            subtitle="Quick visibility into clinic activity this week."
          >
            <View style={styles.statsRow}>
              <SummaryStat
                label="Profile Views"
                value={String(workspaceQuery.data.analytics.totalAppointments)}
              />
              <SummaryStat
                label="Bookings This Week"
                value={String(workspaceQuery.data.analytics.totalClinicBookings)}
              />
              <SummaryStat
                label="Returning Patients"
                value={String(workspaceQuery.data.analytics.activeDoctors)}
              />
            </View>
          </Card>
        </>
      ) : workspaceQuery.data ? (
        <Card
          title="Create clinic profile"
          subtitle="Clinic profile, locations, doctors, appointments, and analytics are managed inside this module."
        >
          <EmptyState
            title="No active clinic profile"
            message="Create a clinic profile before adding locations, inviting doctors, or opening clinic billing."
          />
          <View style={styles.actionGrid}>
            <Button title="Create profile" onPress={() => router.push(ROUTES.clinicProfile)} />
            <Button
              title="Clinic billing"
              variant="secondary"
              onPress={() => router.push(ROUTES.clinicBilling)}
            />
          </View>
        </Card>
      ) : null}

      <SubscriptionPlanCard scope="clinic" />

      {workspaceQuery.data?.clinic &&
      !workspaceQuery.data.canUseFullClinicDashboard ? (
        <Card
          title="Clinic Plan required"
          subtitle="Full clinic dashboard access is gated to the Clinic Plan."
        >
          <EmptyState
            title="Upgrade to manage full clinic operations"
            message="Free or Basic doctor subscriptions cannot manage multiple clinic doctors, clinic appointments, or clinic-level analytics."
            actionLabel="Open clinic billing"
            onAction={() => router.push(ROUTES.clinicBilling)}
          />
        </Card>
      ) : null}

      {workspaceQuery.data?.clinic &&
      workspaceQuery.data.canUseFullClinicDashboard ? (
        <Card
          title="Clinic operations"
          subtitle="Manage connected doctors, clinic appointments, locations, and analytics."
        >
          <View style={styles.actionGrid}>
            <Button
              title="Manage doctors"
              onPress={() => router.push(ROUTES.clinicDoctors)}
            />
            <Button
              title="Clinic appointments"
              variant="secondary"
              onPress={() => router.push(ROUTES.clinicAppointments)}
            />
            <Button
              title="Clinic analytics"
              variant="secondary"
              onPress={() => router.push(ROUTES.clinicAnalytics)}
            />
          </View>
        </Card>
      ) : null}

      <Card
        title="Clinic subscription"
        subtitle="Manage Stripe-hosted subscription checkout, cancellation, and invoice history."
      >
        <Button
          title="Open clinic billing"
          onPress={() => router.push(ROUTES.clinicBilling)}
        />
      </Card>

      <NotificationSummaryCard
        subtitle="Clinic appointment, staff, and subscription updates will appear here."
      />

      <View style={styles.bottomNav}>
        <BottomNavItem active icon="home" label="Dashboard" onPress={() => router.push(ROUTES.clinicHome)} />
        <BottomNavItem icon="user" label="Doctors" onPress={() => router.push(ROUTES.clinicDoctors)} />
        <BottomNavItem icon="location" label="Locations" onPress={() => router.push(ROUTES.clinicProfile)} />
        <BottomNavItem icon="calendar" label="Appointments" onPress={() => router.push(ROUTES.clinicAppointments)} />
        <BottomNavItem icon="shield" label="Profile" onPress={() => router.push(ROUTES.clinicProfile)} />
      </View>

      <Button title="Sign out" variant="ghost" onPress={signOut} style={styles.signOutButton} />
    </Screen>
  );
}

function ClinicMetric({
  actionLabel,
  icon,
  label,
  onPress,
  value
}: {
  actionLabel: string;
  icon: "calendar" | "user" | "location" | "bookmark";
  label: string;
  onPress: () => void;
  value: string;
}) {
  return (
    <View style={styles.metricItem}>
      <View style={styles.metricIconCircle}>
        <PatientGlyph name={icon} color={colors.primary} size={24} />
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
      <Pressable accessibilityRole="button" onPress={onPress}>
        <Text style={styles.metricLink}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

function QuickAction({
  icon,
  label,
  onPress
}: {
  icon: "user" | "location" | "calendar" | "shield";
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.quickCard}>
      <View style={styles.quickIconCircle}>
        <PatientGlyph name={icon} color={colors.primary} size={28} />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </Pressable>
  );
}

function ScheduleRow({
  doctorName,
  patientName,
  reason,
  status,
  time
}: {
  doctorName: string;
  patientName: string;
  reason: string;
  status: string;
  time: string;
}) {
  return (
    <View style={styles.scheduleRow}>
      <View style={styles.scheduleAvatar}>
        <PatientGlyph name="user" color={colors.primary} size={24} />
      </View>
      <View style={styles.scheduleCopy}>
        <Text style={styles.scheduleName}>{patientName}</Text>
        <Text style={styles.scheduleDoctor}>{doctorName}</Text>
        <Text style={styles.scheduleReason}>{reason}</Text>
      </View>
      <View style={styles.scheduleMetaWrap}>
        <Text style={styles.scheduleTime}>{time}</Text>
        <Badge label={formatScheduleStatus(status)} variant={getScheduleVariant(status)} />
      </View>
    </View>
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
    gap: spacing.md
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
  clinicSelector: {
    minHeight: 56,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E3EEF9",
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    ...shadows.soft
  },
  clinicSelectorText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "600"
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
  nextAvatarWrap: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: "#F2FBFC",
    alignItems: "center",
    justifyContent: "center"
  },
  nextCopy: {
    flex: 1,
    gap: spacing.xs
  },
  nextEyebrow: {
    color: colors.primary,
    fontSize: 18,
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
  quickCard: {
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
  quickIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: "#F7FBFF",
    alignItems: "center",
    justifyContent: "center"
  },
  quickLabel: {
    color: "#153067",
    fontSize: 16,
    textAlign: "center",
    fontWeight: "600"
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.md
  },
  stat: {
    flex: 1,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    padding: spacing.md
  },
  statValue: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "900"
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: typography.small,
    fontWeight: "800"
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
    height: 54,
    borderRadius: 18,
    backgroundColor: "#F2FBFC",
    alignItems: "center",
    justifyContent: "center"
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
  scheduleDoctor: {
    color: "#556E9B",
    fontSize: typography.body,
    fontWeight: "600"
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
  actionGrid: {
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
  },
  signOutButton: {
    alignSelf: "center"
  }
});

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function formatScheduleStatus(value: string) {
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
