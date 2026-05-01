import { StyleSheet, Text, View } from "react-native";

import { fontStyles } from "@/constants/fonts";
import { spacing, typography } from "@/constants/theme";

export function AuthOrDivider() {
  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <Text style={styles.text}>or</Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#D9E4F7"
  },
  text: {
    color: "#7385AB",
    fontSize: typography.body,
    ...fontStyles.medium
  }
});
