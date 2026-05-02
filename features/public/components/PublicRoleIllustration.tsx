import { Image, StyleSheet, View, useWindowDimensions } from "react-native";

type PublicRoleIllustrationProps = {
  role: "patient" | "doctor" | "clinic_admin";
};

const patientImage = require("@/assets/branding/role-patient.webp");
const doctorImage = require("@/assets/branding/role-doctor.webp");
const clinicImage = require("@/assets/branding/role-clinic.webp");

export function PublicRoleIllustration({
  role
}: PublicRoleIllustrationProps) {
  const { width } = useWindowDimensions();
  const source =
    role === "doctor"
      ? doctorImage
      : role === "clinic_admin"
        ? clinicImage
        : patientImage;
  const size = width >= 768 ? 156 : width < 380 ? 104 : 136;

  return (
    <View style={[styles.illustrationShell, { width: size, height: size }]}>
      <Image source={source} resizeMode="cover" style={styles.image} />
    </View>
  );
}

const styles = StyleSheet.create({
  illustrationShell: {
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#EDF6FF"
  },
  image: {
    width: "100%",
    height: "100%"
  }
});
