import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/Screen";
import { Avatar, EmptyState, ErrorState, LoadingState } from "@/components/ui";
import { fontStyles } from "@/constants/fonts";
import { ROUTES } from "@/constants/routes";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { PatientGlyph } from "@/features/patient/components/PatientGlyph";
import { PublicBrandLockup } from "@/features/public/components/PublicBrandLockup";
import {
  formatAppointmentStatus,
  isCancelledAppointment,
  isPreviousAppointment,
  isUpcomingAppointment,
  listOwnPatientAppointments,
  type PatientAppointment
} from "@/services/patient.service";

type AppointmentFilter = "upcoming" | "completed" | "cancelled";

const filters: AppointmentFilter[] = ["upcoming", "completed", "cancelled"];

export function PatientAppointmentsScreen() {
  const [activeFilter, setActiveFilter] = useState<AppointmentFilter>("upcoming");
  const appointmentsQuery = useQuery({
    queryKey: ["patient-appointments"],
    queryFn: listOwnPatientAppointments
  });
  const filteredAppointments = useMemo(() => {
    const appointments = appointmentsQuery.data ?? [];

    if (activeFilter === "upcoming") {
      return appointments.filter(isUpcomingAppointment);
    }

    if (activeFilter === "completed") {
      return appointments.filter(isPreviousAppointment);
    }

    return appointments.filter(isCancelledAppointment);
  }, [activeFilter, appointmentsQuery.data]);
  const nextAppointment = filteredAppointments[0] ?? null;
  const otherAppointments =
    activeFilter === "upcoming" ? filteredAppointments.slice(1) : filteredAppointments;

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
        <Text style={styles.title}>My Appointments</Text>
      </View>

      <View style={styles.filterBar}>
        {filters.map((filter) => (
          <Pressable
            accessibilityRole="button"
            key={filter}
            onPress={() => setActiveFilter(filter)}
            style={[styles.filterChip, activeFilter === filter ? styles.filterChipActive : null]}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === filter ? styles.filterChipTextActive : null
              ]}
            >
              {capitalize(filter)}
            </Text>
          </Pressable>
        ))}
      </View>

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
          <>
            {activeFilter === "upcoming" && nextAppointment ? (
              <FeaturedAppointmentCard appointment={nextAppointment} />
            ) : null}

            <SectionHeader
              actionLabel={otherAppointments.length > 0 ? "See all" : undefined}
              onAction={
                otherAppointments.length > 0 ? () => setActiveFilter(activeFilter) : undefined
              }
              title={activeFilter === "upcoming" ? "Other Appointments" : "Appointments"}
            />

            <View style={styles.list}>
              {(activeFilter === "upcoming" ? otherAppointments : filteredAppointments).map(
                (appointment) => (
                  <CompactAppointmentCard appointment={appointment} key={appointment.id} />
                )
              )}
            </View>
          </>
        ) : (
          <View style={styles.emptyCard}>
            <EmptyState
              title={`No ${activeFilter} appointments`}
              message="Search verified doctors to book a new appointment."
              actionLabel="Search doctors"
              onAction={() => router.push(ROUTES.doctors)}
            />
          </View>
        )
      ) : null}

      <View style={styles.bottomNav}>
        <BottomNavItem icon="home" label="Home" onPress={() => router.push(ROUTES.patientHome)} />
        <BottomNavItem icon="search" label="Search" onPress={() => router.push(ROUTES.doctors)} />
        <BottomNavItem active icon="calendar" label="Appointments" onPress={() => router.push(ROUTES.patientAppointments)} />
        <BottomNavItem icon="user" label="Profile" onPress={() => router.push(ROUTES.patientProfile)} />
      </View>
    </Screen>
  );
}

function FeaturedAppointmentCard({
  appointment
}: {
  appointment: PatientAppointment;
}) {
  return (
    <View style={styles.featuredCard}>
      <View style={styles.featuredHeaderRow}>
        <View style={styles.nextPill}>
          <Text style={styles.nextPillText}>Next Appointment</Text>
        </View>
        <StatusPill appointment={appointment} />
      </View>

      <View style={styles.featuredDoctorRow}>
        <Avatar
          imageUrl={appointment.doctor?.profileImageUrl}
          name={appointment.doctor?.fullName ?? "Doctor"}
          size={108}
        />
        <View style={styles.featuredCopy}>
          <Text style={styles.featuredDoctorName}>
            {[appointment.doctor?.title, appointment.doctor?.fullName]
              .filter(Boolean)
              .join(" ") || "Doctor"}
          </Text>
          <Text style={styles.featuredSpecialty}>
            {appointment.doctor?.specialties[0] ?? "General practice"}
          </Text>
          <Text style={styles.featuredQualification}>
            {appointment.doctor?.qualifications[0] ?? "Verified provider"}
          </Text>
        </View>
      </View>

      <View style={styles.featuredInfoRow}>
        <InfoBlock label="Date" value={formatPrettyDate(appointment.appointmentDate)} />
        <InfoBlock label="Time" value={trimSeconds(appointment.startTime)} />
        <InfoBlock
          label="Location"
          value={appointment.location?.name ?? appointment.location?.city ?? "Clinic"}
        />
      </View>

      <View style={styles.featuredFooter}>
        <Pressable
          accessibilityRole="button"
          onPress={() => openAppointment(appointment.id)}
          style={styles.detailsButton}
        >
          <Text style={styles.detailsButtonText}>View details</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => openAppointment(appointment.id)}
          style={styles.roundArrowButton}
        >
          <Text style={styles.roundArrowText}>{">"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function CompactAppointmentCard({
  appointment
}: {
  appointment: PatientAppointment;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => openAppointment(appointment.id)}
      style={styles.compactCard}
    >
      <View style={styles.compactTopRow}>
        <View style={styles.compactDoctorRow}>
          <Avatar
            imageUrl={appointment.doctor?.profileImageUrl}
            name={appointment.doctor?.fullName ?? "Doctor"}
            size={72}
          />
          <View style={styles.compactCopy}>
            <Text style={styles.compactName}>
              {[appointment.doctor?.title, appointment.doctor?.fullName]
                .filter(Boolean)
                .join(" ") || "Doctor"}
            </Text>
            <Text style={styles.compactMeta}>
              {appointment.doctor?.specialties[0] ?? "General practice"}
            </Text>
            <Text style={styles.compactMeta}>
              {appointment.doctor?.qualifications[0] ?? "Verified provider"}
            </Text>
          </View>
        </View>
        <StatusPill appointment={appointment} />
      </View>

      <View style={styles.compactInfoRow}>
        <MiniInfo icon="calendar" value={formatPrettyDate(appointment.appointmentDate)} />
        <MiniInfo icon="bookmark" value={trimSeconds(appointment.startTime)} />
        <MiniInfo
          icon="location"
          value={appointment.location?.name ?? appointment.location?.city ?? "Clinic"}
        />
      </View>
    </Pressable>
  );
}

function StatusPill({ appointment }: { appointment: PatientAppointment }) {
  const cancelled = isCancelledAppointment(appointment);

  return (
    <View
      style={[
        styles.statusPill,
        cancelled ? styles.statusPillDanger : styles.statusPillSuccess
      ]}
    >
      <Text
        style={[
          styles.statusPillText,
          cancelled ? styles.statusPillTextDanger : styles.statusPillTextSuccess
        ]}
      >
        {formatAppointmentStatus(appointment.status)}
      </Text>
    </View>
  );
}

function SectionHeader({
  actionLabel,
  onAction,
  title
}: {
  actionLabel?: string;
  onAction?: () => void;
  title: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {actionLabel && onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction}>
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoBlock}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function MiniInfo({
  icon,
  value
}: {
  icon: "calendar" | "bookmark" | "location";
  value: string;
}) {
  return (
    <View style={styles.miniInfo}>
      <PatientGlyph color={colors.primary} name={icon} size={20} />
      <Text style={styles.miniInfoText}>{value}</Text>
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
  icon: "home" | "search" | "calendar" | "user";
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.bottomNavItem}>
      <PatientGlyph color={active ? colors.primary : "#6B7FA8"} name={icon} size={28} />
      <Text style={[styles.bottomNavLabel, active ? styles.bottomNavLabelActive : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

function openAppointment(appointmentId: string) {
  router.push({
    pathname: "/patient/appointments/[appointmentId]",
    params: { appointmentId }
  });
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function trimSeconds(value: string): string {
  return value.slice(0, 5);
}

function formatPrettyDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg
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
    position: "relative"
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
    color: "#0D2557",
    fontSize: 34,
    lineHeight: 40,
    ...fontStyles.extraBold
  },
  filterBar: {
    flexDirection: "row",
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "#E3EEF9",
    padding: spacing.xs
  },
  filterChip: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
    paddingVertical: spacing.lg
  },
  filterChipActive: {
    backgroundColor: colors.primary
  },
  filterChipText: {
    color: "#36507C",
    fontSize: 17,
    ...fontStyles.medium
  },
  filterChipTextActive: {
    color: colors.white,
    ...fontStyles.bold
  },
  featuredCard: {
    gap: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: "#CDE7EF",
    backgroundColor: "#F5FCFC",
    padding: spacing.xl
  },
  featuredHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  nextPill: {
    borderRadius: radius.full,
    backgroundColor: "#EAF8FA",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm
  },
  nextPillText: {
    color: colors.primary,
    fontSize: 14,
    textTransform: "uppercase",
    ...fontStyles.bold
  },
  statusPill: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm
  },
  statusPillSuccess: {
    backgroundColor: "#EAF8FA"
  },
  statusPillDanger: {
    backgroundColor: "#FDE8E6"
  },
  statusPillText: {
    fontSize: 14,
    ...fontStyles.bold
  },
  statusPillTextSuccess: {
    color: colors.primary
  },
  statusPillTextDanger: {
    color: colors.danger
  },
  featuredDoctorRow: {
    flexDirection: "row",
    gap: spacing.lg
  },
  featuredCopy: {
    flex: 1,
    gap: spacing.xs
  },
  featuredDoctorName: {
    color: "#0D2557",
    fontSize: 28,
    lineHeight: 32,
    ...fontStyles.extraBold
  },
  featuredSpecialty: {
    color: "#425C83",
    fontSize: 18,
    ...fontStyles.medium
  },
  featuredQualification: {
    color: "#577197",
    fontSize: 16,
    ...fontStyles.regular
  },
  featuredInfoRow: {
    flexDirection: "row",
    gap: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "#DCEAF0",
    paddingTop: spacing.lg
  },
  infoBlock: {
    flex: 1,
    gap: spacing.xs
  },
  infoLabel: {
    color: "#5B7094",
    fontSize: 14,
    ...fontStyles.medium
  },
  infoValue: {
    color: "#0D2557",
    fontSize: 17,
    lineHeight: 24,
    ...fontStyles.bold
  },
  featuredFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#DCEAF0",
    paddingTop: spacing.lg
  },
  detailsButton: {
    minWidth: 160,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md
  },
  detailsButtonText: {
    color: colors.primary,
    fontSize: 16,
    ...fontStyles.bold
  },
  roundArrowButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center"
  },
  roundArrowText: {
    color: colors.white,
    fontSize: 28,
    lineHeight: 28,
    ...fontStyles.bold
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  sectionTitle: {
    color: "#24395F",
    fontSize: 20,
    ...fontStyles.extraBold
  },
  sectionAction: {
    color: colors.primary,
    fontSize: 16,
    ...fontStyles.medium
  },
  list: {
    gap: spacing.lg
  },
  compactCard: {
    gap: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#E3EEF9",
    backgroundColor: colors.surface,
    padding: spacing.lg
  },
  compactTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md
  },
  compactDoctorRow: {
    flexDirection: "row",
    gap: spacing.md,
    flex: 1
  },
  compactCopy: {
    flex: 1,
    gap: spacing.xs
  },
  compactName: {
    color: "#0D2557",
    fontSize: 18,
    lineHeight: 24,
    ...fontStyles.bold
  },
  compactMeta: {
    color: "#60749A",
    fontSize: 16,
    lineHeight: 22,
    ...fontStyles.regular
  },
  compactInfoRow: {
    flexDirection: "row",
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#E8EFF7",
    paddingTop: spacing.md
  },
  miniInfo: {
    flex: 1,
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center"
  },
  miniInfoText: {
    flex: 1,
    color: "#29456F",
    fontSize: 15,
    lineHeight: 22,
    ...fontStyles.medium
  },
  emptyCard: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "#E3EEF9"
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    minHeight: 92,
    borderRadius: 30,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "#E3EEF9"
  },
  bottomNavItem: {
    alignItems: "center",
    gap: spacing.sm
  },
  bottomNavLabel: {
    color: "#6B7FA8",
    fontSize: 14,
    ...fontStyles.medium
  },
  bottomNavLabelActive: {
    color: colors.primary
  }
});
