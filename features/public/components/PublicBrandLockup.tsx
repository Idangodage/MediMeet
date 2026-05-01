import { Image, StyleSheet, View } from "react-native";

type PublicBrandLockupProps = {
  centered?: boolean;
  compact?: boolean;
};

export function PublicBrandLockup({
  centered = false,
  compact = false
}: PublicBrandLockupProps) {
  return (
    <View style={[styles.container, centered && styles.centered]}>
      <Image
        source={require("@/assets/branding/medimeet-logo.png")}
        style={compact ? styles.logoCompact : styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center"
  },
  centered: {
    alignSelf: "center"
  },
  logo: {
    width: 220,
    height: 64
  },
  logoCompact: {
    width: 160,
    height: 44
  }
});
