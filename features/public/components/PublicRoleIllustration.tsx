import { StyleSheet, View } from "react-native";

import { colors, radius } from "@/constants/theme";

type PublicRoleIllustrationProps = {
  role: "patient" | "doctor" | "clinic_admin";
};

export function PublicRoleIllustration({
  role
}: PublicRoleIllustrationProps) {
  if (role === "doctor") {
    return (
      <View style={styles.illustrationShell}>
        <View style={styles.doctorBadge} />
        <View style={styles.doctorHead} />
        <View style={styles.doctorHair} />
        <View style={styles.doctorBody} />
        <View style={styles.doctorTie} />
        <View style={styles.doctorCoatLeft} />
        <View style={styles.doctorCoatRight} />
      </View>
    );
  }

  if (role === "clinic_admin") {
    return (
      <View style={styles.illustrationShell}>
        <View style={styles.clinicBuilding}>
          <View style={styles.clinicRoof} />
          <View style={styles.clinicCrossVertical} />
          <View style={styles.clinicCrossHorizontal} />
          <View style={styles.clinicDoor} />
          <View style={styles.clinicWindowLeft} />
          <View style={styles.clinicWindowRight} />
        </View>
        <View style={styles.clinicPlantLeft} />
        <View style={styles.clinicPlantRight} />
      </View>
    );
  }

  return (
    <View style={styles.illustrationShell}>
      <View style={styles.patientCalendar}>
        <View style={styles.patientCalendarTop} />
        <View style={styles.patientCalendarGrid} />
      </View>
      <View style={styles.patientHead} />
      <View style={styles.patientHair} />
      <View style={styles.patientBody} />
      <View style={styles.patientPhone} />
    </View>
  );
}

const styles = StyleSheet.create({
  illustrationShell: {
    width: 136,
    height: 136,
    borderRadius: 28,
    backgroundColor: "#EDF6FF",
    overflow: "hidden"
  },
  patientCalendar: {
    position: "absolute",
    left: 10,
    top: 24,
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.white
  },
  patientCalendarTop: {
    position: "absolute",
    left: 0,
    top: 0,
    right: 0,
    height: 14,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    backgroundColor: "#D9F0FB"
  },
  patientCalendarGrid: {
    position: "absolute",
    left: 12,
    top: 22,
    width: 26,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#41AAC5"
  },
  patientHead: {
    position: "absolute",
    left: 46,
    top: 28,
    width: 34,
    height: 42,
    borderRadius: 18,
    backgroundColor: "#FFD9BF"
  },
  patientHair: {
    position: "absolute",
    left: 34,
    top: 20,
    width: 52,
    height: 66,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 26,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 18,
    backgroundColor: "#172446"
  },
  patientBody: {
    position: "absolute",
    left: 24,
    bottom: -8,
    width: 90,
    height: 92,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: colors.primary
  },
  patientPhone: {
    position: "absolute",
    right: 26,
    top: 68,
    width: 18,
    height: 32,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#163057",
    backgroundColor: "#213B63"
  },
  doctorBadge: {
    position: "absolute",
    left: 12,
    top: 24,
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.white
  },
  doctorHead: {
    position: "absolute",
    left: 44,
    top: 24,
    width: 44,
    height: 50,
    borderRadius: 22,
    backgroundColor: "#FFD9BF"
  },
  doctorHair: {
    position: "absolute",
    left: 40,
    top: 18,
    width: 50,
    height: 28,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    backgroundColor: "#172446"
  },
  doctorBody: {
    position: "absolute",
    left: 34,
    bottom: -10,
    width: 72,
    height: 86,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: colors.white
  },
  doctorTie: {
    position: "absolute",
    left: 63,
    top: 72,
    width: 10,
    height: 44,
    borderRadius: 6,
    backgroundColor: "#5C8DCB"
  },
  doctorCoatLeft: {
    position: "absolute",
    left: 28,
    top: 72,
    width: 24,
    height: 72,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 12,
    backgroundColor: "#F9FCFF",
    transform: [{ rotate: "10deg" }]
  },
  doctorCoatRight: {
    position: "absolute",
    right: 28,
    top: 72,
    width: 24,
    height: 72,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 20,
    backgroundColor: "#F9FCFF",
    transform: [{ rotate: "-10deg" }]
  },
  clinicBuilding: {
    position: "absolute",
    left: 26,
    top: 24,
    width: 84,
    height: 86,
    borderRadius: 10,
    backgroundColor: colors.white
  },
  clinicRoof: {
    position: "absolute",
    left: 14,
    top: 0,
    width: 56,
    height: 18,
    backgroundColor: "#E7F1FF"
  },
  clinicCrossVertical: {
    position: "absolute",
    left: 39,
    top: 14,
    width: 8,
    height: 24,
    borderRadius: 4,
    backgroundColor: "#5C8DCB"
  },
  clinicCrossHorizontal: {
    position: "absolute",
    left: 31,
    top: 22,
    width: 24,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#5C8DCB"
  },
  clinicDoor: {
    position: "absolute",
    left: 34,
    bottom: 0,
    width: 16,
    height: 30,
    backgroundColor: "#6E9ADF"
  },
  clinicWindowLeft: {
    position: "absolute",
    left: 14,
    bottom: 22,
    width: 16,
    height: 20,
    borderRadius: 4,
    backgroundColor: "#DDEBFF"
  },
  clinicWindowRight: {
    position: "absolute",
    right: 14,
    bottom: 22,
    width: 16,
    height: 20,
    borderRadius: 4,
    backgroundColor: "#DDEBFF"
  },
  clinicPlantLeft: {
    position: "absolute",
    left: 16,
    bottom: 18,
    width: 16,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: "#74C8B5"
  },
  clinicPlantRight: {
    position: "absolute",
    right: 16,
    bottom: 14,
    width: 12,
    height: 22,
    borderRadius: radius.full,
    backgroundColor: "#83D3C0"
  }
});
