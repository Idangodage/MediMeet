import { useQuery } from "@tanstack/react-query";
import { StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/Screen";
import { Card, EmptyState, ErrorState, LoadingState } from "@/components/ui";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { getClinicWorkspace } from "@/services/clinic.service";

export function ClinicAnalyticsScreen() {
  const workspaceQuery = useQuery({
    queryKey: ["clinic-workspace"],
    queryFn: getClinicWorkspace
  });

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Clinic analytics</Text>
        <Text style={styles.title}>Clinic-level performance</Text>
        <Text style={styles.subtitle}>
          Analytics are aggregated from clinic-scoped appointment records only.
        </Text>
      </View>

      {workspaceQuery.isLoading ? (
        <LoadingState message="Loading clinic analytics..." />
      ) : null}

      {workspaceQuery.isError ? (
        <ErrorState
          message={
            workspaceQuery.error instanceof Error
              ? workspaceQuery.error.message
              : "Unable to load clinic analytics."
          }
          onRetry={() => void workspaceQuery.refetch()}
        />
      ) : null}

      {workspaceQuery.data && !workspaceQuery.data.canUseFullClinicDashboard ? (
        <Card>
          <EmptyState
            title="Clinic Plan required"
            message="Clinic-level analytics require an active Clinic Plan."
          />
        </Card>
      ) : null}

      {workspaceQuery.data?.canUseFullClinicDashboard ? (
        <>
          <Card title="Overview" subtitle="Appointment and care-team totals.">
            <View style={styles.grid}>
              <Metric
                label="Total bookings"
                value={workspaceQuery.data.analytics.totalClinicBookings}
              />
              <Metric
                label="Upcoming"
                value={workspaceQuery.data.analytics.upcomingAppointments}
              />
              <Metric
                label="Completed"
                value={workspaceQuery.data.analytics.completedAppointments}
              />
              <Metric
                label="Cancelled"
                value={workspaceQuery.data.analytics.cancelledAppointments}
              />
              <Metric
                label="No-show"
                value={workspaceQuery.data.analytics.noShowAppointments}
              />
              <Metric
                label="Active doctors"
                value={workspaceQuery.data.analytics.activeDoctors}
              />
              <Metric
                label="Locations"
                value={workspaceQuery.data.analytics.locations}
              />
              <Metric
                label="Completion rate"
                value={`${workspaceQuery.data.analytics.completionRate}%`}
              />
              <Metric
                label="Cancelled rate"
                value={`${workspaceQuery.data.analytics.cancelledRate}%`}
              />
              <Metric
                label="No-show rate"
                value={`${workspaceQuery.data.analytics.noShowRate}%`}
              />
              <Metric
                label="Revenue estimate"
                value={formatCurrency(
                  workspaceQuery.data.analytics.revenueEstimate,
                  workspaceQuery.data.analytics.revenueCurrency
                )}
              />
            </View>
          </Card>

          <Card
            title="Bookings by doctor"
            subtitle="Top clinic doctors by clinic-linked appointments."
          >
            {workspaceQuery.data.analytics.bookingsByDoctor.length > 0 ? (
              workspaceQuery.data.analytics.bookingsByDoctor.map((item) => (
                <BreakdownRow
                  key={item.doctorId}
                  label={item.doctorName}
                  value={item.value}
                />
              ))
            ) : (
              <Text style={styles.bodyText}>No doctor booking data yet.</Text>
            )}
          </Card>

          <Card
            title="Location performance"
            subtitle="Top clinic locations by appointment volume."
          >
            {workspaceQuery.data.analytics.locationPerformance.length > 0 ? (
              workspaceQuery.data.analytics.locationPerformance.map((item) => (
                <BreakdownRow
                  key={item.locationId}
                  label={item.locationName}
                  value={item.value}
                />
              ))
            ) : (
              <Text style={styles.bodyText}>No location performance data yet.</Text>
            )}
          </Card>

          <Card title="Operational note" subtitle="MVP analytics scope">
            <Text style={styles.bodyText}>
              This dashboard intentionally excludes private doctor appointments
              that are not linked to the clinic. That preserves doctor privacy and
              keeps clinic reporting scoped to clinic operations.
            </Text>
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

function BreakdownRow({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.breakdownRow}>
      <Text style={styles.breakdownLabel}>{label}</Text>
      <Text style={styles.breakdownValue}>
        {value} booking{value === 1 ? "" : "s"}
      </Text>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency
  }).format(amount);
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
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  metric: {
    minWidth: "45%",
    flex: 1,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    padding: spacing.md
  },
  metricValue: {
    color: colors.text,
    fontSize: 32,
    fontWeight: "900"
  },
  metricLabel: {
    color: colors.textMuted,
    fontSize: typography.small,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  bodyText: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24
  },
  breakdownRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md
  },
  breakdownLabel: {
    color: colors.text,
    flex: 1,
    fontSize: typography.body,
    fontWeight: "900"
  },
  breakdownValue: {
    color: colors.textMuted,
    fontSize: typography.small,
    fontWeight: "900",
    textTransform: "uppercase"
  }
});
