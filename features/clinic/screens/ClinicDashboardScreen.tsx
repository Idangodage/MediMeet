import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
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
import { useAuth } from "@/features/auth";
import { NotificationSummaryCard } from "@/features/notifications";
import { SubscriptionPlanCard } from "@/features/subscriptions";
import { getClinicWorkspace } from "@/services/clinic.service";

export function ClinicDashboardScreen() {
  const { signOut } = useAuth();
  const workspaceQuery = useQuery({
    queryKey: ["clinic-workspace"],
    queryFn: getClinicWorkspace
  });

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Clinic admin</Text>
        <Text style={styles.title}>Clinic workspace</Text>
        <Badge label="Clinic Admin" variant="warning" />
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

      {workspaceQuery.data ? (
        <Card
          title={
            workspaceQuery.data.clinic
              ? workspaceQuery.data.clinic.name
              : "Create clinic profile"
          }
          subtitle="Clinic profile, locations, doctors, appointments, and analytics are managed inside this module."
        >
          {workspaceQuery.data.clinic ? (
            <View style={styles.statsRow}>
              <SummaryStat
                label="Doctors"
                value={String(workspaceQuery.data.doctors.length)}
              />
              <SummaryStat
                label="Locations"
                value={String(workspaceQuery.data.locations.length)}
              />
              <SummaryStat
                label="Appointments"
                value={String(workspaceQuery.data.analytics.totalAppointments)}
              />
            </View>
          ) : (
            <EmptyState
              title="No active clinic profile"
              message="Create a clinic profile before adding locations, inviting doctors, or opening clinic billing."
            />
          )}

          <View style={styles.actionGrid}>
            <Button
              title={workspaceQuery.data.clinic ? "Manage profile" : "Create profile"}
              onPress={() => router.push(ROUTES.clinicProfile)}
            />
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

      <Button title="Sign out" variant="ghost" onPress={signOut} />
    </Screen>
  );
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
  actionGrid: {
    gap: spacing.sm
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
