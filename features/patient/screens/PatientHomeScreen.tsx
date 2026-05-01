import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/Screen";
import { Avatar, Button, EmptyState, ErrorState, LoadingState } from "@/components/ui";
import { fontStyles } from "@/constants/fonts";
import { ROUTES } from "@/constants/routes";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { useAuth } from "@/features/auth";
import { PatientGlyph } from "@/features/patient/components/PatientGlyph";
import {
  formatAppointmentStatus,
  getPatientDashboardSummary,
  type PatientAppointment
} from "@/services/patient.service";
import { listPublicDoctors, type PublicDoctor } from "@/services/doctor.service";
import { PublicBrandLockup } from "@/features/public/components/PublicBrandLockup";

export function PatientHomeScreen() {
  const { profile, signOut, user } = useAuth();
  const dashboardQuery = useQuery({
    queryKey: ["patient-dashboard"],
    queryFn: getPatientDashboardSummary
  });
  const recommendedDoctorsQuery = useQuery({
    queryKey: ["patient-home-recommended-doctors"],
    queryFn: () => listPublicDoctors({ verificationStatus: "approved" })
  });
  const nextAppointment = dashboardQuery.data?.upcoming[0] ?? null;
  const recommendedDoctors = (recommendedDoctorsQuery.data ?? []).slice(0, 2);
  const firstName =
    profile?.fullName?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "there";

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

      <View style={styles.heroText}>
        <Text style={styles.greeting}>Good morning, {firstName}</Text>
        <Text style={styles.subheading}>
          Here&apos;s your health overview for today.
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push(ROUTES.doctors)}
        style={styles.searchBar}
      >
        <PatientGlyph name="search" color="#7B8F99" />
        <Text style={styles.searchPlaceholder}>Search doctors or specialties</Text>
        <PatientGlyph name="filter" color={colors.primary} />
      </Pressable>

      {dashboardQuery.isLoading ? (
        <LoadingState message="Loading your health overview..." />
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
          {nextAppointment ? (
            <UpcomingAppointmentCard appointment={nextAppointment} />
          ) : (
            <View style={styles.emptyCard}>
              <EmptyState
                title="No upcoming appointments"
                message="Search verified doctors and book a time that works for you."
                actionLabel="Find doctor"
                onAction={() => router.push(ROUTES.doctors)}
              />
            </View>
          )}

          <SectionHeader title="Quick Actions" />
          <View style={styles.quickActionsRow}>
            <QuickActionCard
              icon="search"
              label="Find Doctor"
              onPress={() => router.push(ROUTES.doctors)}
            />
            <QuickActionCard
              icon="calendar"
              label="Appointments"
              onPress={() => router.push(ROUTES.patientAppointments)}
            />
            <QuickActionCard
              icon="heart"
              label="Favourites"
              onPress={() => router.push(ROUTES.patientFavouriteDoctors)}
            />
            <QuickActionCard
              icon="user"
              label="Profile"
              onPress={() => router.push(ROUTES.patientProfile)}
            />
          </View>

          <SectionHeader
            actionLabel="See all"
            onAction={() => router.push(ROUTES.doctors)}
            title="Recommended Doctors"
          />
          {recommendedDoctorsQuery.isLoading ? (
            <LoadingState message="Finding recommended doctors..." />
          ) : null}
          <View style={styles.recommendedGrid}>
            {recommendedDoctors.map((doctor) => (
              <RecommendedDoctorCard doctor={doctor} key={doctor.id} />
            ))}
          </View>

          <View style={styles.tipCard}>
            <View style={styles.tipIllustration}>
              <PatientGlyph name="leaf" color={colors.primary} size={44} />
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Wellness Tip</Text>
              <Text style={styles.tipText}>
                Start your day with a glass of water and 5 minutes of deep breathing.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push(ROUTES.doctors)}
              >
                <Text style={styles.tipLink}>Explore more health tips {">"}</Text>
              </Pressable>
            </View>
          </View>
        </>
      ) : null}

      <View style={styles.bottomNav}>
        <BottomNavItem active icon="home" label="Home" onPress={() => router.push(ROUTES.patientHome)} />
        <BottomNavItem icon="search" label="Search" onPress={() => router.push(ROUTES.doctors)} />
        <BottomNavItem icon="calendar" label="Appointments" onPress={() => router.push(ROUTES.patientAppointments)} />
        <BottomNavItem icon="user" label="Profile" onPress={() => router.push(ROUTES.patientProfile)} />
      </View>

      <Button title="Sign out" variant="ghost" onPress={signOut} />
    </Screen>
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

function QuickActionCard({
  icon,
  label,
  onPress
}: {
  icon: "search" | "calendar" | "heart" | "user";
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.quickCard}>
      <View style={styles.quickIconCircle}>
        {icon === "user" ? (
          <Text style={styles.quickIconText}>U</Text>
        ) : (
          <PatientGlyph name={icon} color={quickIconColor(icon)} size={30} />
        )}
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </Pressable>
  );
}

function UpcomingAppointmentCard({
  appointment
}: {
  appointment: PatientAppointment;
}) {
  return (
    <View style={styles.upcomingCard}>
      <View style={styles.upcomingSide}>
        <PatientGlyph name="calendar" color={colors.white} size={38} />
        <Text style={styles.upcomingSideTitle}>Upcoming Appointment</Text>
      </View>
      <View style={styles.upcomingMain}>
        <View style={styles.upcomingHeader}>
          <Avatar
            imageUrl={appointment.doctor?.profileImageUrl}
            name={appointment.doctor?.fullName ?? "Doctor"}
            size={72}
          />
          <View style={styles.upcomingIdentity}>
            <Text style={styles.upcomingDoctor}>
              {[appointment.doctor?.title, appointment.doctor?.fullName]
                .filter(Boolean)
                .join(" ") || "Doctor"}
            </Text>
            <Text style={styles.upcomingMeta}>
              {appointment.doctor?.specialties.join(", ") || "General practice"}
            </Text>
            <Text style={styles.upcomingMeta}>
              {appointment.appointmentDate}, {trimSeconds(appointment.startTime)}
            </Text>
            <Text style={styles.upcomingMeta}>
              {appointment.location?.name ?? appointment.location?.city ?? "Clinic"}
            </Text>
          </View>
        </View>
        <View style={styles.upcomingFooter}>
          <Text style={styles.statusText}>{formatAppointmentStatus(appointment.status)}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: "/patient/appointments/[appointmentId]",
                params: { appointmentId: appointment.id }
              })
            }
          >
            <Text style={styles.detailsLink}>View details {">"}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function RecommendedDoctorCard({ doctor }: { doctor: PublicDoctor }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/doctors/${doctor.id}`)}
      style={styles.recommendedCard}
    >
      <View style={styles.recommendedHeader}>
        <Avatar imageUrl={doctor.profileImageUrl} name={doctor.fullName} size={86} />
        <View style={styles.recommendedIdentity}>
          <Text style={styles.recommendedName}>
            {[doctor.title, doctor.fullName].filter(Boolean).join(" ")}
          </Text>
          <Text style={styles.recommendedSpecialty}>
            {doctor.specialties[0] ?? "General practice"}
          </Text>
          <Text style={styles.recommendedRating}>
            {doctor.averageRating.toFixed(1)} ({doctor.reviews.length} reviews)
          </Text>
          <Text style={styles.recommendedAvailability}>
            {doctor.availableSlots.length > 0 ? "Available soon" : "Profile only"}
          </Text>
        </View>
      </View>
      <View style={styles.recommendedBadge}>
        <Text style={styles.recommendedBadgeText}>
          {doctor.yearsOfExperience >= 10 ? "Experienced specialist" : "Verified care"}
        </Text>
      </View>
    </Pressable>
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
      {icon === "user" ? (
        <Text style={[styles.bottomIconText, active ? styles.bottomIconTextActive : null]}>
          U
        </Text>
      ) : (
        <PatientGlyph
          name={icon}
          color={active ? colors.primary : "#6B7FA8"}
          size={28}
        />
      )}
      <Text style={[styles.bottomNavLabel, active ? styles.bottomNavLabelActive : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

function quickIconColor(icon: "search" | "calendar" | "heart" | "user") {
  if (icon === "calendar") {
    return "#347CDE";
  }

  if (icon === "heart") {
    return "#F25C78";
  }

  return colors.primary;
}

function trimSeconds(value: string): string {
  return value.slice(0, 5);
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xl
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
  heroText: {
    gap: spacing.sm
  },
  greeting: {
    color: colors.text,
    fontSize: 34,
    lineHeight: 40,
    ...fontStyles.extraBold
  },
  subheading: {
    color: colors.textMuted,
    fontSize: 18,
    lineHeight: 24,
    ...fontStyles.regular
  },
  searchBar: {
    minHeight: 68,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#D7E4FA",
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg
  },
  searchPlaceholder: {
    flex: 1,
    color: "#7B8F99",
    fontSize: 18,
    ...fontStyles.medium
  },
  emptyCard: {
    borderRadius: 28,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "#E3EEF9"
  },
  upcomingCard: {
    flexDirection: "row",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#BEEDEE",
    backgroundColor: colors.surface,
    overflow: "hidden"
  },
  upcomingSide: {
    width: 136,
    backgroundColor: colors.primary,
    padding: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md
  },
  upcomingSideTitle: {
    color: colors.white,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    ...fontStyles.bold
  },
  upcomingMain: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.lg
  },
  upcomingHeader: {
    flexDirection: "row",
    gap: spacing.md
  },
  upcomingIdentity: {
    flex: 1,
    gap: spacing.xs
  },
  upcomingDoctor: {
    color: "#12306A",
    fontSize: 28,
    lineHeight: 32,
    ...fontStyles.extraBold
  },
  upcomingMeta: {
    color: "#6579A6",
    fontSize: 16,
    lineHeight: 22,
    ...fontStyles.regular
  },
  upcomingFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#E3EEF9",
    paddingTop: spacing.md
  },
  statusText: {
    color: colors.primary,
    fontSize: 16,
    ...fontStyles.bold
  },
  detailsLink: {
    color: colors.primary,
    fontSize: 18,
    ...fontStyles.bold
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 24,
    ...fontStyles.extraBold
  },
  sectionAction: {
    color: colors.primary,
    fontSize: 18,
    ...fontStyles.medium
  },
  quickActionsRow: {
    flexDirection: "row",
    gap: spacing.md
  },
  quickCard: {
    flex: 1,
    minHeight: 150,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "#E3EEF9",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.md
  },
  quickIconCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#F2FBFC",
    alignItems: "center",
    justifyContent: "center"
  },
  quickIconText: {
    color: colors.primary,
    fontSize: 28,
    lineHeight: 28,
    ...fontStyles.bold
  },
  quickLabel: {
    color: "#153067",
    fontSize: 16,
    textAlign: "center",
    ...fontStyles.medium
  },
  recommendedGrid: {
    flexDirection: "row",
    gap: spacing.md
  },
  recommendedCard: {
    flex: 1,
    borderRadius: 28,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "#E3EEF9",
    padding: spacing.lg,
    gap: spacing.md
  },
  recommendedHeader: {
    gap: spacing.md
  },
  recommendedIdentity: {
    gap: spacing.xs
  },
  recommendedName: {
    color: "#12306A",
    fontSize: 18,
    lineHeight: 24,
    ...fontStyles.bold
  },
  recommendedSpecialty: {
    color: "#6579A6",
    fontSize: 16,
    ...fontStyles.regular
  },
  recommendedRating: {
    color: "#556E9B",
    fontSize: 15,
    ...fontStyles.medium
  },
  recommendedAvailability: {
    color: "#4E9B1A",
    fontSize: 15,
    ...fontStyles.medium
  },
  recommendedBadge: {
    alignSelf: "flex-start",
    borderRadius: radius.full,
    backgroundColor: "#EAF8FA",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  recommendedBadgeText: {
    color: colors.primary,
    fontSize: 14,
    ...fontStyles.medium
  },
  tipCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    borderRadius: 28,
    backgroundColor: "#EFF8F9",
    borderWidth: 1,
    borderColor: "#BEEDEE",
    padding: spacing.lg
  },
  tipIllustration: {
    width: 110,
    height: 110,
    borderRadius: 28,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center"
  },
  tipContent: {
    flex: 1,
    gap: spacing.sm
  },
  tipTitle: {
    color: "#153067",
    fontSize: 24,
    ...fontStyles.extraBold
  },
  tipText: {
    color: "#556E9B",
    fontSize: 16,
    lineHeight: 24,
    ...fontStyles.regular
  },
  tipLink: {
    color: colors.primary,
    fontSize: 18,
    ...fontStyles.bold
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
  bottomIconText: {
    color: "#6B7FA8",
    fontSize: 24,
    lineHeight: 24,
    ...fontStyles.bold
  },
  bottomIconTextActive: {
    color: colors.primary
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
