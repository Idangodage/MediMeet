import { router } from "expo-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Pressable, StyleSheet, Text, View } from "react-native";

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
import { ROUTES } from "@/constants/routes";
import { colors, radius, shadows, spacing, typography } from "@/constants/theme";
import { PatientGlyph } from "@/features/patient/components/PatientGlyph";
import { PublicBrandLockup } from "@/features/public/components/PublicBrandLockup";
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
  const featuredAppointment = filteredAppointments[0] ?? null;
  const remainingAppointments = featuredAppointment
    ? filteredAppointments.slice(1)
    : filteredAppointments;

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
        <Text style={styles.title}>Appointments</Text>
        <Text style={styles.subtitle}>
          Manage and track all clinic appointments.
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
          <View style={styles.tabsRow}>
            {statusFilters.map((status) => (
              <Button
                key={status}
                title={status === "all" ? "All" : formatClinicAppointmentStatus(status)}
                variant={filters.status === status ? "primary" : "secondary"}
                onPress={() => setFilters((current) => ({ ...current, status }))}
              />
            ))}
          </View>

          <View style={styles.filtersCard}>
            <Input
              label="Date"
              placeholder="YYYY-MM-DD"
              value={filters.date}
              onChangeText={(date) => setFilters((current) => ({ ...current, date }))}
            />

            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Clinic Location</Text>
              <View style={styles.filterRow}>
                <Button
                  title="All locations"
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
              <Text style={styles.filterLabel}>Doctor</Text>
              <View style={styles.filterRow}>
                <Button
                  title="All doctors"
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
          </View>

          {featuredAppointment ? (
            <View style={styles.featuredCard}>
              <View style={styles.featuredTopRow}>
                <Text style={styles.featuredEyebrow}>Next Appointment</Text>
                <Button
                  title="View Details"
                  variant="secondary"
                  onPress={() => router.push(ROUTES.clinicAppointments)}
                />
              </View>

              <View style={styles.featuredBody}>
                <View style={styles.featuredAvatar}>
                  <PatientGlyph name="user" color={colors.primary} size={28} />
                </View>
                <View style={styles.featuredCopy}>
                  <Text style={styles.featuredName}>{featuredAppointment.patientName}</Text>
                  <Text style={styles.featuredDoctor}>
                    {featuredAppointment.doctor
                      ? [featuredAppointment.doctor.title, featuredAppointment.doctor.fullName]
                          .filter(Boolean)
                          .join(" ")
                      : "Doctor unavailable"}
                  </Text>
                  <Text style={styles.featuredReason}>
                    {featuredAppointment.reasonForVisit ?? "Consultation"}
                  </Text>
                  <View style={styles.featuredMetaRow}>
                    <Text style={styles.featuredMeta}>
                      {trimClinicTime(featuredAppointment.startTime)}
                    </Text>
                    <Text style={styles.featuredMeta}>
                      {featuredAppointment.location?.name ??
                        featuredAppointment.location?.city ??
                        "Clinic location"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ) : null}

          {filteredAppointments.length > 0 ? (
            <View style={styles.list}>
              {remainingAppointments.map((appointment) => (
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

          <View style={styles.summaryStrip}>
            <View style={styles.summaryIcon}>
              <PatientGlyph name="calendar" color={colors.primary} size={24} />
            </View>
            <View style={styles.summaryCopy}>
              <Text style={styles.summaryTitle}>
                {filteredAppointments.length} appointment
                {filteredAppointments.length === 1 ? "" : "s"} in this view
              </Text>
              <Text style={styles.summaryText}>
                Filter by date, location, or doctor without changing the clinic workflow.
              </Text>
            </View>
          </View>
        </>
      ) : null}

      <View style={styles.bottomNav}>
        <BottomNavItem
          icon="home"
          label="Dashboard"
          onPress={() => router.push(ROUTES.clinicHome)}
        />
        <BottomNavItem
          icon="user"
          label="Doctors"
          onPress={() => router.push(ROUTES.clinicDoctors)}
        />
        <BottomNavItem
          icon="location"
          label="Locations"
          onPress={() => router.push(ROUTES.clinicProfile)}
        />
        <BottomNavItem
          active
          icon="calendar"
          label="Appointments"
          onPress={() => router.push(ROUTES.clinicAppointments)}
        />
        <BottomNavItem
          icon="shield"
          label="Profile"
          onPress={() => router.push(ROUTES.clinicProfile)}
        />
      </View>
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
      <View style={styles.appointmentRow}>
        <View style={styles.avatarSmall}>
          <PatientGlyph name="user" color={colors.primary} size={22} />
        </View>
        <View style={styles.appointmentCopy}>
          <Text style={styles.patientName}>{appointment.patientName}</Text>
          <Text style={styles.bodyText}>
            {appointment.doctor
              ? [appointment.doctor.title, appointment.doctor.fullName]
                  .filter(Boolean)
                  .join(" ")
              : "Doctor unavailable"}
          </Text>
          <Text style={styles.reasonText}>
            {appointment.reasonForVisit ?? "Consultation"}
          </Text>
        </View>
        <View style={styles.appointmentMeta}>
          <Text style={styles.metaText}>{trimClinicTime(appointment.startTime)}</Text>
          <Badge
            label={formatClinicAppointmentStatus(appointment.status)}
            variant={getAppointmentVariant(appointment)}
          />
        </View>
      </View>

      <View style={styles.infoGrid}>
        <Info label="Date" value={formatClinicDateTime(appointment)} />
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
      </View>
    </Card>
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

function getAppointmentVariant(
  appointment: Pick<ClinicAppointment, "status">
): "success" | "danger" | "warning" | "neutral" {
  if (appointment.status === "completed") {
    return "success";
  }

  if (isCancelledClinicAppointment(appointment)) {
    return "danger";
  }

  if (["requested", "pending", "no_show"].includes(appointment.status)) {
    return "warning";
  }

  return "neutral";
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
    gap: spacing.sm
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
  tabsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  filtersCard: {
    gap: spacing.lg,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#E3EEF9",
    backgroundColor: colors.surface,
    padding: spacing.lg,
    ...shadows.card
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
  featuredCard: {
    gap: spacing.lg,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#BEEDEE",
    backgroundColor: "#F5FCFC",
    padding: spacing.xl,
    ...shadows.soft
  },
  featuredTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md
  },
  featuredEyebrow: {
    color: colors.primary,
    fontSize: typography.subtitle,
    fontWeight: "900"
  },
  featuredBody: {
    flexDirection: "row",
    gap: spacing.lg,
    alignItems: "center"
  },
  featuredAvatar: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: "#F2FBFC",
    alignItems: "center",
    justifyContent: "center"
  },
  featuredCopy: {
    flex: 1,
    gap: spacing.xs
  },
  featuredName: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "900"
  },
  featuredDoctor: {
    color: "#29456F",
    fontSize: typography.body,
    fontWeight: "700"
  },
  featuredReason: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 22
  },
  featuredMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.lg,
    marginTop: spacing.sm
  },
  featuredMeta: {
    color: "#556E9B",
    fontSize: 16,
    fontWeight: "700"
  },
  list: {
    gap: spacing.lg
  },
  appointmentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md
  },
  avatarSmall: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#F2FBFC",
    alignItems: "center",
    justifyContent: "center"
  },
  appointmentCopy: {
    flex: 1,
    gap: spacing.xs
  },
  appointmentMeta: {
    alignItems: "flex-end",
    gap: spacing.sm
  },
  patientName: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: "900"
  },
  bodyText: {
    color: "#415877",
    fontSize: typography.body,
    lineHeight: 24
  },
  reasonText: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 22
  },
  metaText: {
    color: "#29456F",
    fontSize: typography.body,
    fontWeight: "800"
  },
  infoGrid: {
    gap: spacing.md,
    borderRadius: radius.lg,
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
    fontWeight: "700",
    lineHeight: 22
  },
  summaryStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#DCECF7",
    backgroundColor: "#F7FCFD",
    padding: spacing.lg,
    ...shadows.soft
  },
  summaryIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#ECF9FB",
    alignItems: "center",
    justifyContent: "center"
  },
  summaryCopy: {
    flex: 1,
    gap: spacing.xs
  },
  summaryTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  summaryText: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 22
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
  }
});
