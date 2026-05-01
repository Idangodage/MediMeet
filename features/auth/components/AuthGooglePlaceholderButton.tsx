import { StyleSheet, Text, View } from "react-native";

import { fontStyles } from "@/constants/fonts";
import { colors, radius, spacing } from "@/constants/theme";
import { AuthGlyph } from "@/features/auth/components/AuthGlyph";

type AuthGooglePlaceholderButtonProps = {
  title: string;
};

export function AuthGooglePlaceholderButton({
  title
}: AuthGooglePlaceholderButtonProps) {
  return (
    <View style={styles.container}>
      <AuthGlyph name="google" size={30} color="#2D73E1" />
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 72,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#8FB3F0",
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg
  },
  title: {
    color: "#1D4EAA",
    fontSize: 18,
    ...fontStyles.bold
  }
});
