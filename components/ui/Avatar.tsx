import { Image, StyleSheet, Text, View } from "react-native";

import { colors } from "@/constants/theme";

type AvatarProps = {
  name?: string | null;
  imageUrl?: string | null;
  size?: number;
};

export function Avatar({ name, imageUrl, size = 44 }: AvatarProps) {
  const initials =
    name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "M";

  if (imageUrl) {
    return (
      <Image
        accessibilityLabel={name ? `${name} avatar` : "User avatar"}
        source={{ uri: imageUrl }}
        style={[
          styles.avatar,
          { width: size, height: size, borderRadius: size / 2 }
        ]}
      />
    );
  }

  return (
    <View
      accessibilityLabel={name ? `${name} avatar` : "User avatar"}
      style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <Text style={[styles.initials, { fontSize: Math.max(13, size * 0.34) }]}>
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.border
  },
  initials: {
    color: colors.primaryDark,
    fontWeight: "900"
  }
});
