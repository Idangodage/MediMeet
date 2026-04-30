import { useMemo, useState } from "react";
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
import {
  formatAppointmentStatus,
  canReviewAppointment,
  isCancelledAppointment,
  isPreviousAppointment,
  isUpcomingAppointment,
  listOwnPatientAppointments,
  type PatientAppointment
} from "@/services/patient.service";

type AppointmentFilter = "upcoming" | "previous" | "cancelled" | "all";

const filters: AppointmentFilter[] = [
  "upcoming",
  "previous",
  "cancelled",
  "all"
];

export function PatientAppointmentsScreen() {
  const [activeFilter, setActiveFilter] =
    useState<AppointmentFilter>("upcoming");
  const appointmentsQuery = useQuery({
    queryKey: ["patient-appointments"],
    queryFn: listOwnPatientAppointments
  });
  const filteredAppointments = useMemo(() => {
    const appointments = appointmentsQuery.data ?? [];

    if (activeFilter === "upcoming") {
      return appointments.filter(isUpcomingAppointment);
    }

    if (activeFilter === "previous") {
      return appointments.filter(isPreviousAppointment);
    }

    if (activeFilter === "cancelled") {
      return appointments.filter(isCancelledAppointment);
    }

    return appointments;
  }, [activeFilter, appointmentsQuery.data]);

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Appointments</Text>
        <Text style={styles.title}>My appointments</Text>
        <Text style={styles.subtitle}>
          Upcoming, previous, and cancelled appointments are separated so patient
          history stays easy to scan.
        </Text>
      </View>

      <Card>
        <View style={styles.filterRow}>
          {filters.map((filter) => (
            <Button
              key={filter}
              title={capitalize(filter)}
              variant={activeFilter === filter ? "primary" : "secondary"}
              onPress={() => setActiveFilter(filter)}
            />
          ))}
        </View>
      </Card>

      {appointmentsQuery.isLoading ? (
        <LoadingState message="Loading appointments..." />
      ) : null}

      {appointmentsQuery.isError ? (
        <ErrorState
          message={
            appointmentsQuery.error instanceof Error
              ? appointmentsQuery.error.message
              : "Unable to load appointments."
          }
          onRetry={() => void appointmentsQuery.refetch()}
        />
      ) : null}

      {appointmentsQuery.data ? (
        filteredAppointments.length > 0 ? (
          <View style={styles.list}>
            {filteredAppointments.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))}
          </View>
        ) : (
          <Card>
            <EmptyState
              title={`No ${activeFilter} appointments`}
              message="Search verified doctors to book a new appointment."
              actionLabel="Search doctors"
              onAction={() => router.push(ROUTES.doctors)}
            />
          </Card>
        )
      ) : null}
    </Screen>
  );
}

function AppointmentCard({
  appointment
}: {
  appointment: PatientAppointment;
}) {
  return (
    <Card>
      <View style={styles.appointmentHeader}>
        <Avatar
          imageUrl={appointment.doctor?.profileImageUrl}
          name={appointment.doctor?.fullName ?? "Doctor"}
        />
        <View style={styles.appointmentCopy}>
          <Text style={styles.doctorName}>
            {[appointment.doctor?.title, appointment.doctor?.fullName]
              .filter(Boolean)
              .join(" ") || "Doctor"}
          </Text>
          <Text style={styles.meta}>
            {appointment.doctor?.specialties.join(", ") || "General practice"}
          </Text>
        </View>
        <Badge
          label={formatAppointmentStatus(appointment.status)}
          variant={isCancelledAppointment(appointment) ? "danger" : "success"}
        />
        {canReviewAppointment(appointment) ? (
          <Badge label="Review requested" variant="warning" />
        ) : appointment.review ? (
          <Badge label="Reviewed" variant="success" />
        ) : null}
      </View>

      <View style={styles.infoGrid}>
        <Info label="Date" value={appointment.appointmentDate} />
        <Info
          label="Time"
          value={`${trimSeconds(appointment.startTime)} - ${trimSeconds(
            appointment.endTime
          )}`}
        />
        <Info
          label="Location"
          value={
            appointment.location
              ? formatLocation(appointment.location)
              : "Location unavailable"
          }
        />
      </View>

      <Button
        title={canReviewAppointment(appointment) ? "Leave review" : "View appointment"}
        variant="secondary"
        onPress={() =>
          router.push({
            pathname: "/patient/appointments/[appointmentId]",
            params: { appointmentId: appointment.id }
          })
        }
      />
    </Card>
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

function formatLocation(location: NonNullable<PatientAppointment["location"]>) {
  const label = location.name ?? location.city ?? "Practice location";
  const details = [location.address, location.city].filter(Boolean).join(", ");

  return details ? `${label} - ${details}` : label;
}

function trimSeconds(value: string): string {
  return value.slice(0, 5);
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
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
  list: {
    gap: spacing.lg
  },
  appointmentHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md
  },
  appointmentCopy: {
    flex: 1,
    gap: spacing.xs
  },
  doctorName: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: "900"
  },
  meta: {
    color: colors.textMuted,
    fontSize: typography.small,
    lineHeight: 19
  },
  infoGrid: {
    gap: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.background,
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
