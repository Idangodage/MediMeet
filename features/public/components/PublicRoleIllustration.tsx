import { Image, StyleSheet, View } from "react-native";

type PublicRoleIllustrationProps = {
  role: "patient" | "doctor" | "clinic_admin";
};

const patientImage = require("@/assets/branding/role-patient.webp");
const doctorImage = require("@/assets/branding/role-doctor.webp");
const clinicImage = require("@/assets/branding/role-clinic.webp");

export function PublicRoleIllustration({
  role
}: PublicRoleIllustrationProps) {
  const source =
    role === "doctor"
      ? doctorImage
      : role === "clinic_admin"
        ? clinicImage
        : patientImage;

  return (
    <View style={styles.illustrationShell}>
      <Image source={source} resizeMode="cover" style={styles.image} />
    </View>
  );
}

const styles = StyleSheet.create({
  illustrationShell: {
    width: 136,
    height: 136,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#EDF6FF"
  },
  image: {
    width: "100%",
    height: "100%"
  }
});
