import { Pressable, StyleSheet, Text } from "react-native";
import { router } from "expo-router";

import { fontStyles } from "@/constants/fonts";
import { colors } from "@/constants/theme";

type AuthBackButtonProps = {
  onPress?: () => void;
};

export function AuthBackButton({ onPress }: AuthBackButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress ?? (() => router.back())}
      style={({ pressed }) => [styles.button, pressed ? styles.pressed : null]}
    >
      <Text style={styles.text}>{"<"}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 68,
    height: 68,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#D6E8FF",
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center"
  },
  pressed: {
    opacity: 0.88
  },
  text: {
    color: "#17316B",
    fontSize: 34,
    lineHeight: 34,
    ...fontStyles.medium
  }
});
