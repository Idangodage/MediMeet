import { StyleSheet, Text, View } from "react-native";

import { fontStyles } from "@/constants/fonts";
import { colors, radius, shadows, spacing, typography } from "@/constants/theme";

export function PublicHeroArtwork() {
  return (
    <View style={styles.shell}>
      <View style={styles.canvas}>
        <View style={styles.blobLeft} />
        <View style={styles.blobRight} />
        <View style={styles.dotClusterTop}>
          {Array.from({ length: 9 }).map((_, index) => (
            <View key={`top-${index}`} style={styles.dot} />
          ))}
        </View>
        <View style={styles.dotClusterLeft}>
          {Array.from({ length: 9 }).map((_, index) => (
            <View key={`left-${index}`} style={styles.dot} />
          ))}
        </View>

        <View style={styles.appointmentCard}>
          <View style={styles.calendarBadge}>
            <Text style={styles.calendarBadgeText}>12</Text>
          </View>
          <Text style={styles.cardEyebrow}>Upcoming Appointment</Text>
          <Text style={styles.cardDate}>Mon, May 26</Text>
          <Text style={styles.cardTime}>10:30 AM</Text>
          <View style={styles.miniDoctorRow}>
            <View style={styles.miniAvatar} />
            <View style={styles.miniDoctorText}>
              <Text style={styles.miniDoctorName}>Dr. Emily Carter</Text>
              <Text style={styles.miniDoctorRole}>Cardiologist</Text>
            </View>
          </View>
        </View>

        <View style={styles.secureCard}>
          <View style={styles.secureIcon}>
            <Text style={styles.secureIconText}>S</Text>
          </View>
          <View>
            <Text style={styles.secureTitle}>Secure</Text>
            <Text style={styles.secureSubtitle}>Private care booking</Text>
          </View>
        </View>

        <View style={styles.monitor}>
          <View style={styles.monitorFrame}>
            <View style={styles.cornerAvatar} />
            <View style={styles.doctorHead} />
            <View style={styles.doctorHair} />
            <View style={styles.doctorBody} />
            <View style={styles.doctorShirt} />
            <View style={styles.doctorCoatLeft} />
            <View style={styles.doctorCoatRight} />
            <View style={styles.doctorArm} />
            <View style={styles.doctorHand} />
            <View style={styles.stethoscopeLeft} />
            <View style={styles.stethoscopeRight} />
            <View style={styles.callActions}>
              <View style={[styles.callAction, styles.callActionPrimary]} />
              <View style={styles.callAction} />
              <View style={[styles.callAction, styles.callActionDanger]} />
            </View>
          </View>
          <View style={styles.monitorStand} />
          <View style={styles.monitorBase} />
        </View>

        <View style={styles.patient}>
          <View style={styles.patientHead} />
          <View style={styles.patientHair} />
          <View style={styles.patientBody} />
        </View>

        <View style={styles.phone}>
          <View style={styles.phoneNotch} />
          <View style={styles.phoneBadge}>
            <Text style={styles.phoneBadgeText}>OK</Text>
          </View>
          <Text style={styles.phoneTitle}>Appointment Confirmed</Text>
          <Text style={styles.phoneMeta}>Mon, May 26</Text>
          <Text style={styles.phoneMeta}>10:30 AM</Text>
        </View>

        <View style={styles.plantLeft}>
          <View style={styles.plantLeafLeft} />
          <View style={styles.plantLeafRight} />
          <View style={styles.plantPot} />
        </View>

        <View style={styles.plantRight}>
          <View style={styles.plantLeafTall} />
          <View style={styles.plantLeafShort} />
          <View style={styles.plantPotSmall} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    height: 372,
    borderRadius: 36,
    backgroundColor: "#F5FAFF",
    overflow: "hidden"
  },
  canvas: {
    flex: 1,
    transform: [{ scale: 0.82 }]
  },
  blobLeft: {
    position: "absolute",
    left: -40,
    top: 54,
    width: 320,
    height: 250,
    borderRadius: 130,
    backgroundColor: "#EAF2FF",
    transform: [{ rotate: "-12deg" }]
  },
  blobRight: {
    position: "absolute",
    right: -34,
    top: 64,
    width: 270,
    height: 230,
    borderRadius: 120,
    backgroundColor: "#EEF5FF",
    transform: [{ rotate: "18deg" }]
  },
  dotClusterTop: {
    position: "absolute",
    top: 74,
    left: 248,
    width: 34,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4
  },
  dotClusterLeft: {
    position: "absolute",
    top: 140,
    left: 28,
    width: 34,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: "#C8DAF9"
  },
  appointmentCard: {
    position: "absolute",
    top: 104,
    left: 68,
    width: 128,
    borderRadius: 24,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: spacing.xs,
    ...shadows.card
  },
  calendarBadge: {
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary
  },
  calendarBadgeText: {
    color: colors.white,
    fontSize: 14,
    ...fontStyles.extraBold
  },
  cardEyebrow: {
    color: "#20376C",
    fontSize: typography.body,
    lineHeight: 22,
    ...fontStyles.bold
  },
  cardDate: {
    color: colors.primary,
    fontSize: typography.body,
    ...fontStyles.bold
  },
  cardTime: {
    color: colors.textMuted,
    fontSize: typography.small,
    ...fontStyles.semiBold
  },
  miniDoctorRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs
  },
  miniAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#DDEBFF"
  },
  miniDoctorText: {
    flex: 1
  },
  miniDoctorName: {
    color: "#20376C",
    fontSize: 10,
    ...fontStyles.bold
  },
  miniDoctorRole: {
    color: colors.textMuted,
    fontSize: 10,
    ...fontStyles.semiBold
  },
  secureCard: {
    position: "absolute",
    left: 28,
    bottom: 92,
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: "rgba(255,255,255,0.84)"
  },
  secureIcon: {
    alignItems: "center",
    justifyContent: "center",
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primarySoft
  },
  secureIconText: {
    color: colors.primaryDark,
    fontSize: 13,
    ...fontStyles.extraBold
  },
  secureTitle: {
    color: "#20376C",
    fontSize: typography.body,
    ...fontStyles.bold
  },
  secureSubtitle: {
    color: colors.textMuted,
    fontSize: typography.small,
    ...fontStyles.semiBold
  },
  monitor: {
    position: "absolute",
    left: 164,
    top: 150,
    alignItems: "center"
  },
  monitorFrame: {
    width: 252,
    height: 222,
    borderRadius: 30,
    borderWidth: 10,
    borderColor: "#F7FAFF",
    backgroundColor: "#EAF3FF",
    overflow: "hidden",
    ...shadows.card
  },
  cornerAvatar: {
    position: "absolute",
    right: 18,
    top: 18,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#C8D8FA"
  },
  doctorHead: {
    position: "absolute",
    left: 86,
    top: 34,
    width: 74,
    height: 86,
    borderRadius: 36,
    backgroundColor: "#FFD9BF"
  },
  doctorHair: {
    position: "absolute",
    left: 76,
    top: 24,
    width: 86,
    height: 48,
    borderTopLeftRadius: 42,
    borderTopRightRadius: 42,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    backgroundColor: "#162448"
  },
  doctorBody: {
    position: "absolute",
    left: 70,
    top: 110,
    width: 120,
    height: 116,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    backgroundColor: colors.white
  },
  doctorShirt: {
    position: "absolute",
    left: 109,
    top: 112,
    width: 34,
    height: 110,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    backgroundColor: "#5C8DCB"
  },
  doctorCoatLeft: {
    position: "absolute",
    left: 66,
    top: 118,
    width: 38,
    height: 112,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 28,
    backgroundColor: "#FDFEFF",
    transform: [{ rotate: "8deg" }]
  },
  doctorCoatRight: {
    position: "absolute",
    right: 62,
    top: 118,
    width: 38,
    height: 112,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 32,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 18,
    backgroundColor: "#FDFEFF",
    transform: [{ rotate: "-8deg" }]
  },
  doctorArm: {
    position: "absolute",
    left: 42,
    top: 126,
    width: 44,
    height: 84,
    borderRadius: 24,
    backgroundColor: "#EEF5FF",
    transform: [{ rotate: "18deg" }]
  },
  doctorHand: {
    position: "absolute",
    left: 26,
    top: 140,
    width: 30,
    height: 46,
    borderRadius: 16,
    backgroundColor: "#FFD9BF"
  },
  stethoscopeLeft: {
    position: "absolute",
    left: 88,
    top: 130,
    width: 28,
    height: 54,
    borderWidth: 3,
    borderColor: "#516D96",
    borderTopColor: "transparent",
    borderLeftColor: "transparent",
    borderRadius: 18
  },
  stethoscopeRight: {
    position: "absolute",
    right: 90,
    top: 130,
    width: 28,
    height: 54,
    borderWidth: 3,
    borderColor: "#516D96",
    borderTopColor: "transparent",
    borderRightColor: "transparent",
    borderRadius: 18
  },
  callActions: {
    position: "absolute",
    left: 70,
    bottom: 18,
    flexDirection: "row",
    gap: spacing.sm
  },
  callAction: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#7AA6DF"
  },
  callActionPrimary: {
    backgroundColor: "#5A88D0"
  },
  callActionDanger: {
    backgroundColor: "#F26A6A"
  },
  monitorStand: {
    width: 72,
    height: 34,
    marginTop: -6,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    backgroundColor: "#D6E4F8"
  },
  monitorBase: {
    width: 110,
    height: 16,
    marginTop: -2,
    borderRadius: radius.full,
    backgroundColor: "#DCE8FA"
  },
  patient: {
    position: "absolute",
    right: 64,
    bottom: 56,
    width: 132,
    height: 190
  },
  patientHead: {
    position: "absolute",
    right: 32,
    top: 16,
    width: 58,
    height: 70,
    borderRadius: 28,
    backgroundColor: "#FFD9BF"
  },
  patientHair: {
    position: "absolute",
    right: 0,
    top: 0,
    width: 118,
    height: 148,
    borderTopLeftRadius: 44,
    borderTopRightRadius: 54,
    borderBottomLeftRadius: 64,
    borderBottomRightRadius: 34,
    backgroundColor: "#172446"
  },
  patientBody: {
    position: "absolute",
    right: 8,
    bottom: 0,
    width: 118,
    height: 118,
    borderTopLeftRadius: 44,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    backgroundColor: colors.primary
  },
  phone: {
    position: "absolute",
    right: 102,
    bottom: 74,
    width: 92,
    height: 156,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: "#1C3458",
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.md
  },
  phoneNotch: {
    alignSelf: "center",
    width: 34,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: "#1C3458",
    marginBottom: spacing.md
  },
  phoneBadge: {
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.successSoft,
    marginBottom: spacing.md
  },
  phoneBadgeText: {
    color: colors.success,
    fontSize: 10,
    ...fontStyles.extraBold
  },
  phoneTitle: {
    color: "#20376C",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 15,
    ...fontStyles.bold
  },
  phoneMeta: {
    color: colors.primary,
    fontSize: 10,
    textAlign: "center",
    marginTop: 4,
    ...fontStyles.bold
  },
  plantLeft: {
    position: "absolute",
    left: 14,
    bottom: 26,
    width: 86,
    height: 78
  },
  plantLeafLeft: {
    position: "absolute",
    left: 18,
    top: 8,
    width: 18,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#74C8B5",
    transform: [{ rotate: "-22deg" }]
  },
  plantLeafRight: {
    position: "absolute",
    left: 40,
    top: 0,
    width: 20,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#67BCA8",
    transform: [{ rotate: "22deg" }]
  },
  plantPot: {
    position: "absolute",
    left: 20,
    bottom: 0,
    width: 48,
    height: 28,
    borderRadius: 10,
    backgroundColor: colors.white
  },
  plantRight: {
    position: "absolute",
    right: 14,
    top: 152,
    width: 64,
    height: 96
  },
  plantLeafTall: {
    position: "absolute",
    left: 22,
    top: 10,
    width: 16,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#83D3C0",
    transform: [{ rotate: "-12deg" }]
  },
  plantLeafShort: {
    position: "absolute",
    left: 34,
    top: 24,
    width: 14,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#74C8B5",
    transform: [{ rotate: "22deg" }]
  },
  plantPotSmall: {
    position: "absolute",
    left: 18,
    bottom: 0,
    width: 28,
    height: 22,
    borderRadius: 8,
    backgroundColor: "#DDEBFF"
  }
});
