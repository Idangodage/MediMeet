import { StyleSheet, View } from "react-native";

import { colors, radius, shadows } from "@/constants/theme";
import { AuthGlyph } from "@/features/auth/components/AuthGlyph";

export function ForgotPasswordArtwork() {
  return (
    <View style={styles.shell}>
      <View style={styles.blob} />
      <View style={styles.dotBlock}>
        {Array.from({ length: 9 }).map((_, index) => (
          <View key={index} style={styles.dot} />
        ))}
      </View>
      <View style={styles.planeWrap}>
        <AuthGlyph name="send" size={56} color="#52C6CC" />
      </View>
      <View style={styles.plant} />
      <View style={styles.cup} />
      <View style={styles.envelopeBack} />
      <View style={styles.letter}>
        <View style={styles.letterIcon}>
          <AuthGlyph name="lock" size={28} color={colors.white} />
        </View>
        <View style={styles.letterLineOne} />
        <View style={styles.letterLineTwo} />
      </View>
      <View style={styles.envelopeFront} />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    height: 340,
    borderRadius: 36,
    backgroundColor: "#F7FBFF",
    overflow: "hidden"
  },
  blob: {
    position: "absolute",
    left: 34,
    right: 34,
    top: 54,
    height: 192,
    borderRadius: 96,
    backgroundColor: "#EEF5FF"
  },
  dotBlock: {
    position: "absolute",
    left: 84,
    top: 112,
    width: 42,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: "#C8DAF9"
  },
  planeWrap: {
    position: "absolute",
    right: 94,
    top: 48
  },
  plant: {
    position: "absolute",
    left: 82,
    bottom: 58,
    width: 56,
    height: 82,
    borderRadius: 24,
    backgroundColor: "#74C8B5"
  },
  cup: {
    position: "absolute",
    right: 88,
    bottom: 62,
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "#DDEBFF"
  },
  envelopeBack: {
    position: "absolute",
    left: 246,
    top: 118,
    width: 264,
    height: 180,
    borderRadius: 24,
    backgroundColor: "#E8F0FF"
  },
  letter: {
    position: "absolute",
    left: 296,
    top: 88,
    width: 164,
    height: 152,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: "center",
    paddingTop: 24,
    gap: 16,
    ...shadows.soft
  },
  letterIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center"
  },
  letterLineOne: {
    width: 86,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D7E5FA"
  },
  letterLineTwo: {
    width: 66,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D7E5FA"
  },
  envelopeFront: {
    position: "absolute",
    left: 246,
    top: 174,
    width: 264,
    height: 124,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    backgroundColor: "#F1F6FF"
  }
});
