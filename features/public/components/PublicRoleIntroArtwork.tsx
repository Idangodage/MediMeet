import { StyleSheet, Text, View } from "react-native";

import { fontStyles } from "@/constants/fonts";
import { colors, radius, shadows, spacing, typography } from "@/constants/theme";

type PublicRoleIntroArtworkProps = {
  role: "patient" | "doctor" | "clinic_admin";
};

export function PublicRoleIntroArtwork({
  role
}: PublicRoleIntroArtworkProps) {
  if (role === "doctor") {
    return (
      <View style={styles.shell}>
        <View style={styles.blobLeft} />
        <View style={styles.blobRight} />
        <View style={styles.profileBoard}>
          <View style={styles.doctorFigureLarge}>
            <View style={styles.doctorHeadLarge} />
            <View style={styles.doctorHairLarge} />
            <View style={styles.doctorBodyLarge} />
            <View style={styles.doctorTieLarge} />
          </View>
          <View style={styles.profileContent}>
            <Text style={styles.profileName}>Dr. Emily Carter</Text>
            <Text style={styles.profileMeta}>Cardiologist</Text>
            <Text style={styles.profileMetaMuted}>MD, DM (Cardiology)</Text>
            <Text style={styles.profileHighlight}>12+ years experience</Text>
            <View style={styles.infoRows}>
              <Text style={styles.infoRow}>Verified Doctor</Text>
              <Text style={styles.infoRow}>Mumbai, Maharashtra</Text>
              <Text style={styles.infoRow}>4.9 (256 reviews)</Text>
            </View>
            <View style={styles.specialtyRow}>
              <View style={styles.specialtyChip}>
                <Text style={styles.specialtyChipText}>Interventional Cardiology</Text>
              </View>
              <View style={styles.specialtyChip}>
                <Text style={styles.specialtyChipText}>Preventive Cardiology</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.verifiedCard}>
          <View style={styles.verifiedIconCircle}>
            <Text style={styles.verifiedIconText}>v</Text>
          </View>
          <Text style={styles.sideCardTitle}>Verified Profile</Text>
          <Text style={styles.sideCardText}>
            Your profile is verified and patients can trust you.
          </Text>
        </View>

        <View style={styles.performanceCard}>
          <Text style={styles.sideCardTitle}>Profile Performance</Text>
          <View style={styles.performanceGraph}>
            <View style={styles.graphLineOne} />
            <View style={styles.graphLineTwo} />
          </View>
          <Text style={styles.performanceStat}>1,248</Text>
          <Text style={styles.performanceGain}>+32%</Text>
        </View>

        <View style={styles.featureBar}>
          <FeatureIcon label="Add Qualifications" />
          <FeatureIcon label="List Your Specialities" />
          <FeatureIcon label="Manage Services" />
          <FeatureIcon label="Add Visiting Locations" />
        </View>
      </View>
    );
  }

  if (role === "clinic_admin") {
    return (
      <View style={styles.shell}>
        <View style={styles.blobLeft} />
        <View style={styles.blobRight} />
        <View style={styles.clinicBuildingLarge}>
          <View style={styles.clinicRoofLarge} />
          <View style={styles.clinicSign}>MediMeet Clinic</View>
          <View style={styles.clinicWindowA} />
          <View style={styles.clinicWindowB} />
          <View style={styles.clinicWindowC} />
          <View style={styles.clinicDoorLarge} />
        </View>

        <View style={styles.dashboardFrame}>
          <View style={styles.sidebar} />
          <View style={styles.dashboardTopRow}>
            <MetricCard label="Appointments Today" value="24" />
            <MetricCard label="Upcoming" value="36" />
            <MetricCard label="Doctors" value="12" />
            <MetricCard label="Locations" value="3" />
          </View>
          <View style={styles.dashboardMainRow}>
            <View style={styles.calendarPanel}>
              <Text style={styles.panelTitle}>Appointments</Text>
              <View style={styles.calendarGrid} />
            </View>
            <View style={styles.appointmentPanel}>
              <Text style={styles.panelTitle}>Today</Text>
              <Text style={styles.smallPanelText}>10:30 AM Emily Carter</Text>
              <Text style={styles.smallPanelText}>11:30 AM James Wilson</Text>
              <Text style={styles.smallPanelText}>02:00 PM Sophia Lee</Text>
            </View>
          </View>
        </View>

        <View style={styles.locationsCard}>
          <Text style={styles.sideCardTitle}>Locations</Text>
          <Text style={styles.smallPanelText}>Main Clinic</Text>
          <Text style={styles.smallPanelText}>Downtown</Text>
          <Text style={styles.smallPanelText}>Westside</Text>
        </View>

        <View style={styles.doctorsCard}>
          <Text style={styles.sideCardTitle}>Doctors</Text>
          <Text style={styles.smallPanelText}>Dr. Emily Carter</Text>
          <Text style={styles.smallPanelText}>Dr. James Wilson</Text>
          <Text style={styles.smallPanelText}>Dr. Sophia Lee</Text>
        </View>

        <View style={styles.calendarStandCard}>
          <View style={styles.standCalendarTop} />
          <View style={styles.standCalendarGrid} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.shell}>
      <View style={styles.blobLeft} />
      <View style={styles.blobRight} />
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>Q</Text>
        <Text style={styles.searchPlaceholder}>Search doctors, specialties...</Text>
        <Text style={styles.searchFilter}>|||</Text>
      </View>

      <View style={styles.filterRow}>
        <FilterChip label="New York, NY" selected />
        <FilterChip label="Cardiology" />
        <FilterChip label="Available Today" />
        <FilterChip label="Any Fee" />
      </View>

      <View style={styles.mapBoard}>
        <View style={styles.mapLineA} />
        <View style={styles.mapLineB} />
        <View style={styles.mapLineC} />
        <View style={styles.mapPin}>
          <Text style={styles.mapPinText}>+</Text>
        </View>
      </View>

      <View style={styles.doctorCardLeft}>
        <View style={styles.avatarSquare} />
        <View style={styles.cardContent}>
          <Text style={styles.profileNameSmall}>Dr. Daniel Kim</Text>
          <Text style={styles.profileMetaSmall}>Cardiologist</Text>
          <Text style={styles.profileRating}>4.9 (128)</Text>
          <Text style={styles.profileAvailability}>Available Today</Text>
        </View>
      </View>

      <View style={styles.doctorCardRight}>
        <View style={styles.avatarSquareFemale} />
        <View style={styles.cardContent}>
          <Text style={styles.profileNameSmall}>Dr. Priya Shah</Text>
          <Text style={styles.profileMetaSmall}>Dermatologist</Text>
          <Text style={styles.profileRating}>4.8 (96)</Text>
          <Text style={styles.profileAvailability}>Available Tomorrow</Text>
        </View>
      </View>

      <View style={styles.doctorCardBottom}>
        <View style={styles.avatarSquareBeard} />
        <View style={styles.cardContent}>
          <Text style={styles.profileNameSmall}>Dr. Michael Lee</Text>
          <Text style={styles.profileMetaSmall}>Orthopedic Surgeon</Text>
          <Text style={styles.profileRating}>4.9 (156)</Text>
          <Text style={styles.profileAvailability}>Available Today</Text>
        </View>
      </View>

      <View style={styles.verifiedMiniCard}>
        <Text style={styles.sideCardTitle}>Verified Doctors</Text>
        <Text style={styles.sideCardText}>Licensed and background checked</Text>
      </View>

      <View style={styles.flexMiniCard}>
        <Text style={styles.sideCardTitle}>Flexible Availability</Text>
        <Text style={styles.sideCardText}>Book online at your convenience</Text>
      </View>
    </View>
  );
}

function FilterChip({
  label,
  selected = false
}: {
  label: string;
  selected?: boolean;
}) {
  return (
    <View style={[styles.filterChip, selected && styles.filterChipSelected]}>
      <Text
        style={[
          styles.filterChipText,
          selected && styles.filterChipTextSelected
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function FeatureIcon({ label }: { label: string }) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureCircle} />
      <Text style={styles.featureLabel}>{label}</Text>
    </View>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    height: 580,
    borderRadius: 40,
    backgroundColor: "#F5FAFF",
    overflow: "hidden"
  },
  blobLeft: {
    position: "absolute",
    left: -34,
    top: 70,
    width: 260,
    height: 180,
    borderRadius: 100,
    backgroundColor: "#EAF2FF",
    transform: [{ rotate: "-18deg" }]
  },
  blobRight: {
    position: "absolute",
    right: -26,
    top: 60,
    width: 250,
    height: 180,
    borderRadius: 100,
    backgroundColor: "#EEF5FF",
    transform: [{ rotate: "16deg" }]
  },
  searchBar: {
    position: "absolute",
    left: 100,
    top: 38,
    right: 90,
    height: 64,
    borderRadius: 24,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    ...shadows.soft
  },
  searchIcon: {
    color: colors.primary,
    fontSize: 22,
    ...fontStyles.medium
  },
  searchPlaceholder: {
    flex: 1,
    color: "#7A8DB3",
    fontSize: typography.body,
    ...fontStyles.regular
  },
  searchFilter: {
    color: "#3E78D3",
    fontSize: 18,
    ...fontStyles.bold
  },
  filterRow: {
    position: "absolute",
    left: 84,
    right: 72,
    top: 126,
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap"
  },
  filterChip: {
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.soft
  },
  filterChipSelected: {
    backgroundColor: colors.primary
  },
  filterChipText: {
    color: "#17316B",
    fontSize: typography.small,
    ...fontStyles.semiBold
  },
  filterChipTextSelected: {
    color: colors.white
  },
  mapBoard: {
    position: "absolute",
    left: 160,
    top: 190,
    width: 240,
    height: 300,
    borderRadius: 36,
    backgroundColor: "#EAF3FF",
    transform: [{ rotate: "-8deg" }]
  },
  mapLineA: {
    position: "absolute",
    left: 30,
    top: 40,
    width: 180,
    height: 3,
    backgroundColor: "#D4E3FB",
    transform: [{ rotate: "38deg" }]
  },
  mapLineB: {
    position: "absolute",
    left: 20,
    top: 120,
    width: 200,
    height: 3,
    backgroundColor: "#D4E3FB",
    transform: [{ rotate: "-28deg" }]
  },
  mapLineC: {
    position: "absolute",
    left: 36,
    top: 210,
    width: 160,
    height: 3,
    backgroundColor: "#D4E3FB",
    transform: [{ rotate: "64deg" }]
  },
  mapPin: {
    position: "absolute",
    left: 92,
    top: 94,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center"
  },
  mapPinText: {
    color: colors.white,
    fontSize: 32,
    lineHeight: 32,
    ...fontStyles.bold
  },
  doctorCardLeft: {
    position: "absolute",
    left: 40,
    top: 212,
    width: 250,
    borderRadius: 26,
    backgroundColor: colors.surface,
    padding: spacing.md,
    flexDirection: "row",
    gap: spacing.md,
    ...shadows.card
  },
  doctorCardRight: {
    position: "absolute",
    right: 32,
    top: 266,
    width: 236,
    borderRadius: 26,
    backgroundColor: colors.surface,
    padding: spacing.md,
    flexDirection: "row",
    gap: spacing.md,
    ...shadows.card
  },
  doctorCardBottom: {
    position: "absolute",
    left: 192,
    bottom: 76,
    width: 268,
    borderRadius: 26,
    backgroundColor: colors.surface,
    padding: spacing.md,
    flexDirection: "row",
    gap: spacing.md,
    ...shadows.card
  },
  avatarSquare: {
    width: 86,
    height: 86,
    borderRadius: 18,
    backgroundColor: "#D8E8FF"
  },
  avatarSquareFemale: {
    width: 78,
    height: 78,
    borderRadius: 18,
    backgroundColor: "#DDEBFF"
  },
  avatarSquareBeard: {
    width: 78,
    height: 78,
    borderRadius: 18,
    backgroundColor: "#D8E8FF"
  },
  cardContent: {
    flex: 1,
    gap: 5
  },
  profileNameSmall: {
    color: "#163067",
    fontSize: 16,
    ...fontStyles.bold
  },
  profileMetaSmall: {
    color: "#6C80AA",
    fontSize: typography.small,
    ...fontStyles.regular
  },
  profileRating: {
    color: "#556E9B",
    fontSize: typography.small,
    ...fontStyles.medium
  },
  profileAvailability: {
    color: colors.primary,
    fontSize: typography.small,
    ...fontStyles.semiBold
  },
  verifiedMiniCard: {
    position: "absolute",
    left: 30,
    bottom: 124,
    width: 160,
    borderRadius: 24,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.card
  },
  flexMiniCard: {
    position: "absolute",
    right: 34,
    bottom: 112,
    width: 152,
    borderRadius: 24,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.card
  },
  sideCardTitle: {
    color: "#17316B",
    fontSize: 16,
    lineHeight: 22,
    ...fontStyles.bold
  },
  sideCardText: {
    color: "#7385AB",
    fontSize: typography.small,
    lineHeight: 19,
    ...fontStyles.regular
  },
  profileBoard: {
    position: "absolute",
    left: 88,
    right: 86,
    top: 108,
    bottom: 120,
    borderRadius: 34,
    backgroundColor: colors.surface,
    flexDirection: "row",
    padding: spacing.xl,
    ...shadows.card
  },
  doctorFigureLarge: {
    width: 180,
    alignItems: "center",
    justifyContent: "flex-end"
  },
  doctorHeadLarge: {
    position: "absolute",
    top: 34,
    width: 88,
    height: 96,
    borderRadius: 44,
    backgroundColor: "#FFD9BF"
  },
  doctorHairLarge: {
    position: "absolute",
    top: 18,
    width: 98,
    height: 52,
    borderTopLeftRadius: 44,
    borderTopRightRadius: 44,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    backgroundColor: "#172446"
  },
  doctorBodyLarge: {
    width: 136,
    height: 220,
    borderTopLeftRadius: 48,
    borderTopRightRadius: 48,
    backgroundColor: colors.white
  },
  doctorTieLarge: {
    position: "absolute",
    top: 136,
    width: 20,
    height: 120,
    borderRadius: 10,
    backgroundColor: "#5C8DCB"
  },
  profileContent: {
    flex: 1,
    gap: spacing.sm,
    paddingTop: spacing.md
  },
  profileName: {
    color: "#163067",
    fontSize: 28,
    lineHeight: 34,
    ...fontStyles.extraBold
  },
  profileMeta: {
    color: "#556E9B",
    fontSize: 18,
    ...fontStyles.medium
  },
  profileMetaMuted: {
    color: "#6E84AD",
    fontSize: typography.body,
    ...fontStyles.regular
  },
  profileHighlight: {
    color: colors.primary,
    fontSize: typography.body,
    ...fontStyles.semiBold
  },
  infoRows: {
    gap: spacing.sm,
    marginTop: spacing.md
  },
  infoRow: {
    color: "#4D648E",
    fontSize: typography.body,
    ...fontStyles.medium
  },
  specialtyRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md
  },
  specialtyChip: {
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: "#D8E8FF",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: "#F7FBFF"
  },
  specialtyChipText: {
    color: "#3E74C7",
    fontSize: typography.small,
    ...fontStyles.medium
  },
  verifiedCard: {
    position: "absolute",
    top: 124,
    right: 38,
    width: 160,
    borderRadius: 24,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadows.card
  },
  verifiedIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center"
  },
  verifiedIconText: {
    color: colors.white,
    fontSize: 22,
    lineHeight: 22,
    ...fontStyles.bold
  },
  performanceCard: {
    position: "absolute",
    right: 38,
    bottom: 178,
    width: 184,
    borderRadius: 24,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadows.card
  },
  performanceGraph: {
    height: 74,
    borderRadius: 16,
    backgroundColor: "#F4F8FF",
    overflow: "hidden"
  },
  graphLineOne: {
    position: "absolute",
    left: 18,
    bottom: 24,
    width: 110,
    height: 3,
    backgroundColor: "#67A0F2",
    transform: [{ rotate: "16deg" }]
  },
  graphLineTwo: {
    position: "absolute",
    left: 86,
    bottom: 32,
    width: 40,
    height: 3,
    backgroundColor: "#67A0F2",
    transform: [{ rotate: "46deg" }]
  },
  performanceStat: {
    color: "#163067",
    fontSize: 24,
    ...fontStyles.extraBold
  },
  performanceGain: {
    color: colors.primary,
    fontSize: typography.body,
    ...fontStyles.bold
  },
  featureBar: {
    position: "absolute",
    left: 102,
    right: 96,
    bottom: 48,
    height: 120,
    borderRadius: 28,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    paddingHorizontal: spacing.md,
    ...shadows.card
  },
  featureItem: {
    alignItems: "center",
    gap: spacing.sm,
    width: 100
  },
  featureCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primarySoft
  },
  featureLabel: {
    color: "#17316B",
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center",
    ...fontStyles.medium
  },
  clinicBuildingLarge: {
    position: "absolute",
    left: 34,
    top: 66,
    width: 260,
    height: 140,
    borderRadius: 22,
    backgroundColor: colors.surface,
    ...shadows.card
  },
  clinicRoofLarge: {
    position: "absolute",
    left: 30,
    top: 0,
    width: 200,
    height: 24,
    backgroundColor: "#E7F1FF"
  },
  clinicSign: {
    position: "absolute",
    top: 32,
    left: 52,
    color: "#5C7DB2",
    fontSize: 20,
    ...fontStyles.bold
  },
  clinicWindowA: {
    position: "absolute",
    left: 36,
    top: 62,
    width: 40,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#DDEBFF"
  },
  clinicWindowB: {
    position: "absolute",
    left: 110,
    top: 62,
    width: 40,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#DDEBFF"
  },
  clinicWindowC: {
    position: "absolute",
    right: 36,
    top: 62,
    width: 40,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#DDEBFF"
  },
  clinicDoorLarge: {
    position: "absolute",
    left: 114,
    bottom: 0,
    width: 32,
    height: 48,
    backgroundColor: "#6E9ADF"
  },
  dashboardFrame: {
    position: "absolute",
    left: 86,
    right: 130,
    top: 176,
    bottom: 74,
    borderRadius: 34,
    backgroundColor: colors.surface,
    borderWidth: 6,
    borderColor: "#658BC8",
    ...shadows.card
  },
  sidebar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 88,
    backgroundColor: "#F3F8FF"
  },
  dashboardTopRow: {
    position: "absolute",
    left: 104,
    top: 28,
    right: 24,
    flexDirection: "row",
    gap: spacing.sm
  },
  metricCard: {
    flex: 1,
    minHeight: 56,
    borderRadius: 14,
    backgroundColor: "#FBFDFF",
    padding: spacing.sm
  },
  metricLabel: {
    color: "#6C80AA",
    fontSize: 10,
    ...fontStyles.medium
  },
  metricValue: {
    color: "#163067",
    fontSize: 24,
    ...fontStyles.extraBold
  },
  dashboardMainRow: {
    position: "absolute",
    left: 104,
    top: 104,
    right: 24,
    bottom: 24,
    flexDirection: "row",
    gap: spacing.md
  },
  calendarPanel: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: "#FBFDFF",
    padding: spacing.md
  },
  appointmentPanel: {
    width: 170,
    borderRadius: 18,
    backgroundColor: "#FBFDFF",
    padding: spacing.md,
    gap: spacing.sm
  },
  panelTitle: {
    color: "#17316B",
    fontSize: typography.body,
    ...fontStyles.bold
  },
  calendarGrid: {
    flex: 1,
    marginTop: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2EBFA"
  },
  smallPanelText: {
    color: "#5E759F",
    fontSize: typography.small,
    lineHeight: 18,
    ...fontStyles.regular
  },
  locationsCard: {
    position: "absolute",
    left: 12,
    bottom: 56,
    width: 168,
    borderRadius: 22,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.card
  },
  doctorsCard: {
    position: "absolute",
    right: 12,
    top: 246,
    width: 196,
    borderRadius: 22,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.card
  },
  calendarStandCard: {
    position: "absolute",
    right: 70,
    bottom: 38,
    width: 122,
    height: 112,
    borderRadius: 20,
    backgroundColor: colors.surface,
    ...shadows.soft
  },
  standCalendarTop: {
    position: "absolute",
    left: 14,
    top: 12,
    right: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#DDEBFF"
  },
  standCalendarGrid: {
    position: "absolute",
    left: 18,
    top: 40,
    right: 18,
    bottom: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2EBFA"
  }
});
