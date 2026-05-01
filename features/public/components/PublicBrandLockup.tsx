import { StyleSheet, Text, View } from "react-native";

import { fontStyles } from "@/constants/fonts";
import { colors, radius, spacing, typography } from "@/constants/theme";

type PublicBrandLockupProps = {
  centered?: boolean;
};

export function PublicBrandLockup({
  centered = false
}: PublicBrandLockupProps) {
  return (
    <View style={[styles.container, centered && styles.centered]}>
      <View style={styles.mark}>
        <View style={styles.markInner}>
          <Text style={styles.markText}>+</Text>
        </View>
      </View>
      <Text style={styles.wordmark}>
        <Text style={styles.wordmarkDark}>Medi</Text>
        <Text style={styles.wordmarkAccent}>Meet</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md
  },
  centered: {
    alignSelf: "center"
  },
  mark: {
    alignItems: "center",
    justifyContent: "center",
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: "#B8EEF0"
  },
  markInner: {
    alignItems: "center",
    justifyContent: "center",
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: colors.primary
  },
  markText: {
    color: colors.white,
    fontSize: 24,
    lineHeight: 26,
    ...fontStyles.extraBold
  },
  wordmark: {
    fontSize: typography.title,
    letterSpacing: -1,
    ...fontStyles.extraBold
  },
  wordmarkDark: {
    color: "#13306B"
  },
  wordmarkAccent: {
    color: colors.primary
  }
});
