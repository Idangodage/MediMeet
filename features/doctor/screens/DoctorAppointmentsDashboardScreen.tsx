import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

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
import { colors, radius, spacing, typography } from "@/constants/theme";
import {
  formatDoctorAppointmentDateTime,
  formatDoctorAppointmentStatus,
  formatDoctorLocation,
  getDoctorAppointmentDashboardData,
  isCancelledDoctorAppointment,
  trimAppointmentTime,
  type DoctorAppointment,
  type DoctorAppointmentDashboardData
} from "@/services/doctorAppointments.service";
import {
  canViewAnalytics,
  getOwnDoctorSubscriptionContext
} from "@/services/subscription.service";

type AppointmentFilter =
  | "today"
  | "upcoming"
  | "requested"
  | "completed"
  | "cancelled"
  | "noShow"
  | "all";

const filters: AppointmentFilter[] = [
  "today",
  "upcoming",
  "requested",
  "completed",
  "cancelled",
  "noShow",
  "all"
];

export function DoctorAppointmentsDashboardScreen() {
  const [activeFilter, setActiveFilter] =
    useState<AppointmentFilter>("today");
  const dashboardQuery = useQuery({
    queryKey: ["doctor-appointment-dashboard"],
    queryFn: getDoctorAppointmentDashboardData
  });
  const subscriptionQuery = useQuery({
    queryKey: ["doctor-subscription-context"],
    queryFn: getOwnDoctorSubscriptionContext
  });
  const appointments = useMemo(() => {
    if (!dashboardQuery.data) {
      return [];
    }

    return getFilteredAppointments(dashboardQuery.data, activeFilter);
  }, [activeFilter, dashboardQuery.data]);

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Doctor appointments</Text>
        <Text style={styles.title}>Appointment dashboard</Text>
        <Text style={styles.subtitle}>
          Manage booked patients, requested appointments, completed visits,
          cancellations, and no-shows from your doctor scope only.
        </Text>
      </View>

      {dashboardQuery.isLoading ? (
        <LoadingState message="Loading appointment dashboard..." />
      ) : null}

      {dashboardQuery.isError ? (
        <ErrorState
          message={
            dashboardQuery.error instanceof Error
              ? dashboardQuery.error.message
              : "Unable to load doctor appointments."
          }
          onRetry={() => void dashboardQuery.refetch()}
        />
      ) : null}

      {dashboardQuery.data ? (
        <>
          {subscriptionQuery.data && canViewAnalytics(subscriptionQuery.data) ? (
            <AnalyticsCard data={dashboardQuery.data} />
          ) : (
            <Card
              title="Analytics locked"
              subtitle="Analytics are available on Pro and Clinic plans."
            >
              <Text style={styles.bodyText}>
                Your appointment lists remain available, and existing appointments
                are never deleted when a subscription is inactive. Upgrade later to
                unlock completion, cancellation, no-show, and patient analytics.
              </Text>
            </Card>
          )}

          <Card>
            <View style={styles.filterRow}>
              {filters.map((filter) => (
                <Button
                  key={filter}
                  title={formatFilterLabel(filter)}
                  variant={activeFilter === filter ? "primary" : "secondary"}
                  onPress={() => setActiveFilter(filter)}
                />
              ))}
            </View>
          </Card>

          {appointments.length > 0 ? (
            <View style={styles.list}>
              {appointments.map((appointment) => (
                <DoctorAppointmentCard
                  appointment={appointment}
                  key={appointment.id}
                />
              ))}
            </View>
          ) : (
            <Card>
              <EmptyState
                title={`No ${formatFilterLabel(activeFilter).toLowerCase()} appointments`}
                message="Appointments booked by patients will appear here once they match this status."
                actionLabel="Manage availability"
                onAction={() => router.push(ROUTES.doctorAvailability)}
              />
            </Card>
          )}
        </>
      ) : null}

      <Button
        title="Back to doctor home"
        variant="ghost"
        onPress={() => router.push(ROUTES.doctorHome)}
      />
    </Screen>
  );
}

function AnalyticsCard({ data }: { data: DoctorAppointmentDashboardData }) {
  return (
    <Card
      title="Practice analytics"
      subtitle="Simple operational metrics from appointments visible to this doctor."
    >
      <View style={styles.statsRow}>
        <Stat label="Profile views" value={String(data.analytics.profileViews)} />
        <Stat label="Total bookings" value={String(data.analytics.totalBookings)} />
        <Stat label="Upcoming" value={String(data.upcoming.length)} />
      </View>
      <View style={styles.statsRow}>
        <Stat
          label="Completed"
          value={String(data.analytics.completedAppointments)}
        />
        <Stat
          label="Cancelled"
          value={String(data.analytics.cancelledAppointments)}
        />
        <Stat label="No-show" value={String(data.noShow.length)} />
      </View>
      <View style={styles.metricsBox}>
        <Metric label="New patients" value={String(data.analytics.newPatients)} />
        <Metric
          label="Returning patients"
          value={String(data.analytics.returningPatients)}
        />
        <Metric
          label="Treated patients"
          value={String(data.analytics.treatedPatients)}
        />
        <Metric
          label="Completion rate"
          value={`${data.analytics.completionRate}%`}
        />
        <Metric
          label="Cancellation rate"
          value={`${data.analytics.cancellationRate}%`}
        />
        <Metric label="No-show rate" value={`${data.analytics.noShowRate}%`} />
      </View>
      <View style={styles.metricsBox}>
        <Text style={styles.sectionLabel}>Most booked days</Text>
        {data.analytics.mostBookedDays.length > 0 ? (
          data.analytics.mostBookedDays.map((item) => (
            <Metric
              key={item.label}
              label={item.label}
              value={`${item.value} booking${item.value === 1 ? "" : "s"}`}
            />
          ))
        ) : (
          <Text style={styles.bodyText}>No booking day data yet.</Text>
        )}
      </View>
      <View style={styles.metricsBox}>
        <Text style={styles.sectionLabel}>Most active location</Text>
        {data.analytics.mostActiveLocation ? (
          <Metric
            label={data.analytics.mostActiveLocation.label}
            value={`${data.analytics.mostActiveLocation.value} booking${
              data.analytics.mostActiveLocation.value === 1 ? "" : "s"
            }`}
          />
        ) : (
          <Text style={styles.bodyText}>No location activity yet.</Text>
        )}
      </View>
    </Card>
  );
}

function DoctorAppointmentCard({
  appointment
}: {
  appointment: DoctorAppointment;
}) {
  return (
    <Card>
      <View style={styles.appointmentHeader}>
        <View style={styles.appointmentCopy}>
          <Text style={styles.patientName}>
            {appointment.patient?.fullName ?? "Patient"}
          </Text>
          <Text style={styles.meta}>
            {formatDoctorAppointmentDateTime(appointment)}
          </Text>
        </View>
        <Badge
          label={formatDoctorAppointmentStatus(appointment.status)}
          variant={getStatusVariant(appointment)}
        />
      </View>

      <View style={styles.infoBox}>
        <Info
          label="Time"
          value={`${trimAppointmentTime(
            appointment.startTime
          )} - ${trimAppointmentTime(appointment.endTime)}`}
        />
        <Info label="Location" value={formatDoctorLocation(appointment.location)} />
        <Info
          label="Reason"
          value={appointment.reasonForVisit || "No reason provided."}
        />
      </View>

      <Button
        title="View appointment"
        variant="secondary"
        onPress={() =>
          router.push({
            pathname: "/doctor/appointments/[appointmentId]",
            params: { appointmentId: appointment.id }
          })
        }
      />
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricRow}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
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

function getFilteredAppointments(
  data: DoctorAppointmentDashboardData,
  filter: AppointmentFilter
): DoctorAppointment[] {
  if (filter === "all") {
    return [
      ...data.today,
      ...data.upcoming,
      ...data.requested,
      ...data.completed,
      ...data.cancelled,
      ...data.noShow
    ].filter(
      (appointment, index, all) =>
        all.findIndex((item) => item.id === appointment.id) === index
    );
  }

  return data[filter];
}

function getStatusVariant(
  appointment: DoctorAppointment
): "neutral" | "success" | "warning" | "danger" {
  if (isCancelledDoctorAppointment(appointment)) {
    return "danger";
  }

  if (appointment.status === "completed") {
    return "success";
  }

  if (appointment.status === "no_show") {
    return "warning";
  }

  if (["requested", "pending"].includes(appointment.status)) {
    return "warning";
  }

  return "neutral";
}

function formatFilterLabel(filter: AppointmentFilter): string {
  if (filter === "noShow") {
    return "No-show";
  }

  return filter.charAt(0).toUpperCase() + filter.slice(1);
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.primaryTint,
    padding: spacing.xl
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
    letterSpacing: -0.5,
    lineHeight: 34
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
  statsRow: {
    flexDirection: "row",
    gap: spacing.md
  },
  stat: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.primaryTint,
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
  metricsBox: {
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.primaryTint,
    padding: spacing.md
  },
  metricRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md
  },
  metricLabel: {
    color: colors.textMuted,
    flex: 1,
    fontSize: typography.small,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  metricValue: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  sectionLabel: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  list: {
    gap: spacing.lg
  },
  appointmentHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  appointmentCopy: {
    flex: 1,
    gap: spacing.xs
  },
  patientName: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: "900"
  },
  meta: {
    color: colors.textMuted,
    fontSize: typography.small,
    lineHeight: 19
  },
  bodyText: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24
  },
  infoBox: {
    gap: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.primaryTint,
    padding: spacing.md
  },
  infoItem: {
    gap: spacing.xs
  },
  infoLabel: {
    color: colors.textMuted,
    fontSize: typography.small,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  infoValue: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "800",
    lineHeight: 23
  }
});
