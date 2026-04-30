import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/Screen";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  LoadingState
} from "@/components/ui";
import { colors, radius, spacing, typography } from "@/constants/theme";
import {
  formatClinicAppointmentStatus,
  formatClinicDateTime,
  getClinicWorkspace,
  isCancelledClinicAppointment,
  trimClinicTime,
  type AppointmentStatus,
  type ClinicAppointment
} from "@/services/clinic.service";

type ClinicAppointmentFilter = {
  date: string;
  doctorId: string;
  locationId: string;
  status: AppointmentStatus | "all";
};

const statusFilters: (AppointmentStatus | "all")[] = [
  "all",
  "requested",
  "pending",
  "confirmed",
  "completed",
  "cancelled_by_patient",
  "cancelled_by_doctor",
  "no_show"
];

export function ClinicAppointmentsScreen() {
  const [filters, setFilters] = useState<ClinicAppointmentFilter>({
    date: "",
    doctorId: "all",
    locationId: "all",
    status: "all"
  });
  const workspaceQuery = useQuery({
    queryKey: ["clinic-workspace"],
    queryFn: getClinicWorkspace
  });
  const filteredAppointments = useMemo(
    () => applyAppointmentFilters(workspaceQuery.data?.appointments ?? [], filters),
    [filters, workspaceQuery.data?.appointments]
  );

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Clinic appointments</Text>
        <Text style={styles.title}>Appointments across clinic doctors</Text>
        <Text style={styles.subtitle}>
          This view is limited to appointments linked to your clinic locations and
          doctors.
        </Text>
      </View>

      {workspaceQuery.isLoading ? (
        <LoadingState message="Loading clinic appointments..." />
      ) : null}

      {workspaceQuery.isError ? (
        <ErrorState
          message={
            workspaceQuery.error instanceof Error
              ? workspaceQuery.error.message
              : "Unable to load clinic appointments."
          }
          onRetry={() => void workspaceQuery.refetch()}
        />
      ) : null}

      {workspaceQuery.data && !workspaceQuery.data.canUseFullClinicDashboard ? (
        <Card>
          <EmptyState
            title="Clinic Plan required"
            message="Clinic appointment views require an active Clinic Plan."
          />
        </Card>
      ) : null}

      {workspaceQuery.data?.canUseFullClinicDashboard ? (
        <>
          <Card title="Filters" subtitle="Filter by doctor, date, status, and location.">
            <Input
              label="Date"
              placeholder="YYYY-MM-DD"
              value={filters.date}
              onChangeText={(date) => setFilters((current) => ({ ...current, date }))}
            />

            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Doctor</Text>
              <View style={styles.filterRow}>
                <Button
                  title="All"
                  variant={filters.doctorId === "all" ? "primary" : "secondary"}
                  onPress={() =>
                    setFilters((current) => ({ ...current, doctorId: "all" }))
                  }
                />
                {workspaceQuery.data.doctors.map((doctor) => (
                  <Button
                    key={doctor.doctorId}
                    title={doctor.fullName}
                    variant={
                      filters.doctorId === doctor.doctorId ? "primary" : "secondary"
                    }
                    onPress={() =>
                      setFilters((current) => ({
                        ...current,
                        doctorId: doctor.doctorId
                      }))
                    }
                  />
                ))}
              </View>
            </View>

            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Location</Text>
              <View style={styles.filterRow}>
                <Button
                  title="All"
                  variant={filters.locationId === "all" ? "primary" : "secondary"}
                  onPress={() =>
                    setFilters((current) => ({ ...current, locationId: "all" }))
                  }
                />
                {workspaceQuery.data.locations.map((location) => (
                  <Button
                    key={location.id}
                    title={location.city}
                    variant={
                      filters.locationId === location.id ? "primary" : "secondary"
                    }
                    onPress={() =>
                      setFilters((current) => ({
                        ...current,
                        locationId: location.id
                      }))
                    }
                  />
                ))}
              </View>
            </View>

            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Status</Text>
              <View style={styles.filterRow}>
                {statusFilters.map((status) => (
                  <Button
                    key={status}
                    title={status === "all" ? "All" : formatClinicAppointmentStatus(status)}
                    variant={filters.status === status ? "primary" : "secondary"}
                    onPress={() =>
                      setFilters((current) => ({ ...current, status }))
                    }
                  />
                ))}
              </View>
            </View>
          </Card>

          {filteredAppointments.length > 0 ? (
            <View style={styles.list}>
              {filteredAppointments.map((appointment) => (
                <ClinicAppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                />
              ))}
            </View>
          ) : (
            <Card>
              <EmptyState
                title="No appointments"
                message="No clinic appointments match the selected filters."
              />
            </Card>
          )}
        </>
      ) : null}
    </Screen>
  );
}

function ClinicAppointmentCard({
  appointment
}: {
  appointment: ClinicAppointment;
}) {
  return (
    <Card>
      <View style={styles.appointmentHeader}>
        <View style={styles.appointmentCopy}>
          <Text style={styles.patientName}>{appointment.patientName}</Text>
          <Text style={styles.bodyText}>
            {appointment.doctor
              ? [appointment.doctor.title, appointment.doctor.fullName]
                  .filter(Boolean)
                  .join(" ")
              : "Doctor unavailable"}
          </Text>
          <Text style={styles.metaText}>{formatClinicDateTime(appointment)}</Text>
        </View>
        <Badge
          label={formatClinicAppointmentStatus(appointment.status)}
          variant={isCancelledClinicAppointment(appointment) ? "danger" : "success"}
        />
      </View>

      <View style={styles.infoGrid}>
        <Info
          label="Time"
          value={`${trimClinicTime(appointment.startTime)} - ${trimClinicTime(
            appointment.endTime
          )}`}
        />
        <Info
          label="Location"
          value={
            appointment.location
              ? [
                  appointment.location.name,
                  appointment.location.address,
                  appointment.location.city
                ]
                  .filter(Boolean)
                  .join(", ")
              : "Location unavailable"
          }
        />
        <Info
          label="Reason"
          value={appointment.reasonForVisit ?? "No reason provided"}
        />
      </View>
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

function applyAppointmentFilters(
  appointments: ClinicAppointment[],
  filters: ClinicAppointmentFilter
): ClinicAppointment[] {
  return appointments.filter((appointment) => {
    if (filters.date && appointment.appointmentDate !== filters.date.trim()) {
      return false;
    }

    if (filters.doctorId !== "all" && appointment.doctorId !== filters.doctorId) {
      return false;
    }

    if (filters.locationId !== "all" && appointment.locationId !== filters.locationId) {
      return false;
    }

    if (filters.status !== "all" && appointment.status !== filters.status) {
      return false;
    }

    return true;
  });
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
  filterGroup: {
    gap: spacing.sm
  },
  filterLabel: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: "900",
    textTransform: "uppercase"
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
  patientName: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: "900"
  },
  bodyText: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24
  },
  metaText: {
    color: colors.textMuted,
    fontSize: typography.small,
    fontWeight: "800"
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
