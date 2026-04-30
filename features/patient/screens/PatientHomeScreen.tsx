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
import { NotificationSummaryCard } from "@/features/notifications";
import {
  formatAppointmentStatus,
  getPatientDashboardSummary,
  type PatientAppointment
} from "@/services/patient.service";

export function PatientHomeScreen() {
  const { profile, signOut, user } = useAuth();
  const dashboardQuery = useQuery({
    queryKey: ["patient-dashboard"],
    queryFn: getPatientDashboardSummary
  });
  const nextAppointment = dashboardQuery.data?.upcoming[0] ?? null;

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.identity}>
          <Avatar
            imageUrl={profile?.avatarUrl}
            name={profile?.fullName ?? user?.email}
          />
          <View style={styles.identityText}>
            <Text style={styles.eyebrow}>Patient dashboard</Text>
            <Text style={styles.title}>
              {profile?.fullName ?? user?.email ?? "Patient"}
            </Text>
            <Text style={styles.subtitle}>
              Appointments, visited doctors, and notifications in one private workspace.
            </Text>
          </View>
        </View>
        <Badge label="Patient" variant="success" />
      </View>

      {dashboardQuery.isLoading ? (
        <LoadingState message="Loading dashboard..." />
      ) : null}

      {dashboardQuery.isError ? (
        <ErrorState
          message={
            dashboardQuery.error instanceof Error
              ? dashboardQuery.error.message
              : "Unable to load patient dashboard."
          }
          onRetry={() => void dashboardQuery.refetch()}
        />
      ) : null}

      {dashboardQuery.data ? (
        <>
          <Card title="Appointment summary">
            <View style={styles.statsRow}>
              <Stat label="Upcoming" value={dashboardQuery.data.upcoming.length} />
              <Stat label="Previous" value={dashboardQuery.data.previous.length} />
              <Stat label="Cancelled" value={dashboardQuery.data.cancelled.length} />
            </View>
            <View style={styles.statsRow}>
              <Stat label="Favourites" value={dashboardQuery.data.favouritesCount} />
              <Stat label="Visited doctors" value={dashboardQuery.data.visitedDoctorsCount} />
            </View>
          </Card>

          <Card
            title="Next appointment"
            subtitle="Your closest upcoming appointment appears here."
          >
            {nextAppointment ? (
              <NextAppointment appointment={nextAppointment} />
            ) : (
              <EmptyState
                title="No upcoming appointments"
                message="Search verified doctors and choose an available time."
                actionLabel="Search doctors"
                onAction={() => router.push(ROUTES.doctors)}
              />
            )}
          </Card>

          <Card
            title="Review requests"
            subtitle="Completed appointments waiting for your feedback."
          >
            {dashboardQuery.data.reviewRequests.length > 0 ? (
              dashboardQuery.data.reviewRequests.slice(0, 3).map((appointment) => (
                <ReviewRequestCard key={appointment.id} appointment={appointment} />
              ))
            ) : (
              <EmptyState
                title="No review requests"
                message="Review requests appear after a doctor marks an appointment completed."
              />
            )}
          </Card>

          <Card title="Patient tools">
            <View style={styles.actionGrid}>
              <Button
                title="My appointments"
                onPress={() => router.push(ROUTES.patientAppointments)}
              />
              <Button
                title="Visited doctors"
                variant="secondary"
                onPress={() => router.push(ROUTES.patientVisitedDoctors)}
              />
              <Button
                title="Favourite doctors"
                variant="secondary"
                onPress={() => router.push(ROUTES.patientFavouriteDoctors)}
              />
              <Button
                title="Profile settings"
                variant="secondary"
                onPress={() => router.push(ROUTES.patientProfile)}
              />
            </View>
          </Card>
        </>
      ) : null}

      <NotificationSummaryCard subtitle="Recent appointment and account updates." />

      <Button title="Sign out" variant="ghost" onPress={signOut} />
    </Screen>
  );
}

function ReviewRequestCard({
  appointment
}: {
  appointment: PatientAppointment;
}) {
  return (
    <View style={styles.reviewRequest}>
      <View style={styles.nextHeader}>
        <Avatar
          imageUrl={appointment.doctor?.profileImageUrl}
          name={appointment.doctor?.fullName ?? "Doctor"}
        />
        <View style={styles.identityText}>
          <Text style={styles.nextDoctor}>
            {[appointment.doctor?.title, appointment.doctor?.fullName]
              .filter(Boolean)
              .join(" ") || "Doctor"}
          </Text>
          <Text style={styles.bodyText}>
            Completed on {appointment.appointmentDate}
          </Text>
        </View>
        <Badge label="Review requested" variant="warning" />
      </View>
      <Button
        title="Leave review"
        variant="secondary"
        onPress={() =>
          router.push({
            pathname: "/patient/appointments/[appointmentId]",
            params: { appointmentId: appointment.id }
          })
        }
      />
    </View>
  );
}

function NextAppointment({
  appointment
}: {
  appointment: PatientAppointment;
}) {
  return (
    <View style={styles.nextAppointment}>
      <View style={styles.nextHeader}>
        <Avatar
          imageUrl={appointment.doctor?.profileImageUrl}
          name={appointment.doctor?.fullName ?? "Doctor"}
        />
        <View style={styles.identityText}>
          <Text style={styles.nextDoctor}>
            {[appointment.doctor?.title, appointment.doctor?.fullName]
              .filter(Boolean)
              .join(" ") || "Doctor"}
          </Text>
          <Text style={styles.bodyText}>
            {appointment.doctor?.specialties.join(", ") || "General practice"}
          </Text>
        </View>
        <Badge label={formatAppointmentStatus(appointment.status)} />
      </View>
      <View style={styles.infoBox}>
        <Info label="Date" value={appointment.appointmentDate} />
        <Info
          label="Time"
          value={`${trimSeconds(appointment.startTime)} - ${trimSeconds(
            appointment.endTime
          )}`}
        />
      </View>
      <Button
        title="View appointment"
        variant="secondary"
        onPress={() =>
          router.push({
            pathname: "/patient/appointments/[appointmentId]",
            params: { appointmentId: appointment.id }
          })
        }
      />
    </View>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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

function trimSeconds(value: string): string {
  return value.slice(0, 5);
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
  actionGrid: {
    gap: spacing.sm
  },
  nextAppointment: {
    gap: spacing.md
  },
  reviewRequest: {
    gap: spacing.md,
    borderBottomWidth: 1,
    borderColor: colors.border,
    paddingBottom: spacing.md
  },
  nextHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md
  },
  nextDoctor: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: "900"
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
    fontWeight: "800"
  },
});
