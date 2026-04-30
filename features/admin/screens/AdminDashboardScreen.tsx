import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/Screen";
import { Badge, Button, Card, ErrorState, LoadingState } from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { useAuth } from "@/features/auth";
import { NotificationSummaryCard } from "@/features/notifications";
import {
  formatAuditAction,
  getAdminDashboardOverview,
  type AdminDashboardOverview
} from "@/services/admin.service";

export function AdminDashboardScreen() {
  const { signOut } = useAuth();
  const overviewQuery = useQuery({
    queryKey: ["admin-dashboard-overview"],
    queryFn: getAdminDashboardOverview
  });

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Platform admin</Text>
        <Text style={styles.title}>MediMeet operations</Text>
        <Text style={styles.subtitle}>
          Review platform risk, verification, billing, reports, and audit
          activity from one protected admin area.
        </Text>
        <Badge label="Platform Admin" variant="danger" />
      </View>

      {overviewQuery.isLoading ? (
        <LoadingState message="Loading platform overview..." />
      ) : null}

      {overviewQuery.isError ? (
        <ErrorState
          message={
            overviewQuery.error instanceof Error
              ? overviewQuery.error.message
              : "Unable to load admin overview."
          }
          onRetry={() => void overviewQuery.refetch()}
        />
      ) : null}

      {overviewQuery.data ? <OverviewCards data={overviewQuery.data} /> : null}

      <Card title="Admin workspaces" subtitle="Platform-admin only screens.">
        <View style={styles.actionGrid}>
          <Button
            title="Doctor verification queue"
            onPress={() => router.push(ROUTES.adminVerifications)}
          />
          <Button
            title="Users"
            variant="secondary"
            onPress={() => router.push(ROUTES.adminUsers)}
          />
          <Button
            title="Subscription overview"
            variant="secondary"
            onPress={() => router.push(ROUTES.adminBilling)}
          />
          <Button
            title="Review moderation"
            variant="secondary"
            onPress={() => router.push(ROUTES.adminReviews)}
          />
          <Button
            title="Reports"
            variant="secondary"
            onPress={() => router.push(ROUTES.adminReports)}
          />
          <Button
            title="Audit logs"
            variant="secondary"
            onPress={() => router.push(ROUTES.adminAuditLogs)}
          />
        </View>
      </Card>

      <NotificationSummaryCard
        subtitle="Verification, reported profile, and failed payment alerts appear here."
      />

      <Button title="Sign out" variant="ghost" onPress={signOut} />
    </Screen>
  );
}

function OverviewCards({ data }: { data: AdminDashboardOverview }) {
  return (
    <>
      <Card title="Platform health" subtitle="Current operational workload.">
        <View style={styles.statGrid}>
          <Stat label="Users" value={data.totalUsers} variant="neutral" />
          <Stat
            label="Verifications"
            value={data.pendingVerificationCount}
            variant={data.pendingVerificationCount > 0 ? "warning" : "success"}
          />
          <Stat
            label="Open reports"
            value={data.openReportCount}
            variant={data.openReportCount > 0 ? "danger" : "success"}
          />
          <Stat
            label="Failed payments"
            value={data.failedPaymentCount}
            variant={data.failedPaymentCount > 0 ? "danger" : "success"}
          />
          <Stat
            label="Past due"
            value={data.pastDueSubscriptionCount}
            variant={data.pastDueSubscriptionCount > 0 ? "warning" : "success"}
          />
        </View>
      </Card>

      <Card title="Admin analytics" subtitle="Core platform aggregate metrics.">
        <View style={styles.statGrid}>
          <Stat label="Total doctors" value={data.totalDoctors} variant="neutral" />
          <Stat
            label="Verified doctors"
            value={data.verifiedDoctors}
            variant="success"
          />
          <Stat
            label="Active subscriptions"
            value={data.activeSubscriptions}
            variant="success"
          />
          <Stat label="Trial users" value={data.trialUsers} variant="warning" />
          <Stat
            label="Total appointments"
            value={data.totalAppointments}
            variant="neutral"
          />
          <Stat
            label="Monthly revenue"
            value={formatCurrencyList(data.monthlyRecurringRevenue)}
            variant="success"
          />
        </View>
      </Card>

      <Card title="Users by role">
        <View style={styles.statGrid}>
          <Stat label="Patients" value={data.usersByRole.patient} variant="neutral" />
          <Stat label="Doctors" value={data.usersByRole.doctor} variant="success" />
          <Stat
            label="Clinic admins"
            value={data.usersByRole.clinic_admin}
            variant="warning"
          />
          <Stat
            label="Platform admins"
            value={data.usersByRole.platform_admin}
            variant="danger"
          />
        </View>
      </Card>

      <Card title="Recent audit activity" subtitle="Latest sensitive events.">
        {data.recentAuditLogs.slice(0, 5).map((log) => (
          <View key={log.id} style={styles.auditRow}>
            <View style={styles.auditCopy}>
              <Text style={styles.auditTitle}>{formatAuditAction(log.action)}</Text>
              <Text style={styles.bodyText}>
                {log.resourceType} {log.resourceId ? `- ${log.resourceId.slice(0, 8)}` : ""}
              </Text>
            </View>
            <Badge label={formatDate(log.createdAt)} variant="neutral" />
          </View>
        ))}
        {data.recentAuditLogs.length === 0 ? (
          <Text style={styles.bodyText}>No audit events recorded yet.</Text>
        ) : null}
      </Card>
    </>
  );
}

function Stat({
  label,
  value,
  variant
}: {
  label: string;
  value: number | string;
  variant: "danger" | "neutral" | "success" | "warning";
}) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Badge label={label} variant={variant} />
    </View>
  );
}

function formatCurrencyList(
  values: AdminDashboardOverview["monthlyRecurringRevenue"]
): string {
  if (values.length === 0) {
    return "$0";
  }

  return values
    .map((item) =>
      new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: item.currency
      }).format(item.amount)
    )
    .join(" / ");
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.md
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
  bodyText: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24
  },
  actionGrid: {
    gap: spacing.sm
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  stat: {
    minWidth: "45%",
    flex: 1,
    gap: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    padding: spacing.md
  },
  statValue: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "900"
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: typography.small,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  auditRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    borderBottomWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md
  },
  auditCopy: {
    flex: 1,
    gap: spacing.xs
  },
  auditTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  }
});
