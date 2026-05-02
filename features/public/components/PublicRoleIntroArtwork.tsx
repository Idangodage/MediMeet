import { Image, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { fontStyles } from "@/constants/fonts";
import { colors, radius, shadows, spacing, typography } from "@/constants/theme";

type PublicRoleIntroArtworkProps = {
  role: "patient" | "doctor" | "clinic_admin";
};

export function PublicRoleIntroArtwork({
  role
}: PublicRoleIntroArtworkProps) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const artworkWidth = Math.min(width - 12, isTablet ? 820 : 560);
  const patientHeight = Math.round(artworkWidth * 0.76);
  const doctorHeight = Math.round(artworkWidth * 0.84);
  const clinicHeight = Math.round(artworkWidth * 0.82);

  if (role === "doctor") {
    return (
      <View
        style={[
          styles.shell,
          styles.centeredShell,
          styles.doctorShell,
          { width: artworkWidth, height: doctorHeight }
        ]}
      >
        <Image
          source={require("../../../assets/branding/create-doctor-account.webp")}
          style={styles.doctorArtworkImage}
          resizeMode="contain"
        />
      </View>
    );
  }

  if (role === "clinic_admin") {
    return (
      <View
        style={[
          styles.shell,
          styles.centeredShell,
          styles.clinicShell,
          { width: artworkWidth, height: clinicHeight }
        ]}
      >
        <Image
          source={require("../../../assets/branding/create-clinic-account.webp")}
          style={styles.clinicArtworkImage}
          resizeMode="contain"
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.shell,
        styles.centeredShell,
        styles.patientShell,
        { width: artworkWidth, height: patientHeight }
      ]}
    >
      <Image
        source={require("../../../assets/branding/create-patient-account.webp")}
        style={styles.patientArtworkImage}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: 40,
    backgroundColor: "#F5FAFF",
    overflow: "visible"
  },
  centeredShell: {
    alignSelf: "center",
    width: "100%"
  },
  patientShell: {
    backgroundColor: "transparent"
  },
  doctorShell: {
    backgroundColor: "transparent"
  },
  clinicShell: {
    backgroundColor: "transparent"
  },
  patientArtworkImage: {
    width: "100%",
    height: "100%",
    transform: [{ scale: 1.18 }]
  },
  doctorArtworkImage: {
    width: "100%",
    height: "100%",
    transform: [{ scale: 1.16 }]
  },
  clinicArtworkImage: {
    width: "100%",
    height: "100%",
    transform: [{ scale: 1.12 }]
  }
});
