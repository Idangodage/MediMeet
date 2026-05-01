import { StyleSheet, Text, View } from "react-native";

import { fontStyles } from "@/constants/fonts";
import { colors } from "@/constants/theme";

type AuthGlyphName =
  | "user"
  | "mail"
  | "phone"
  | "lock"
  | "eye"
  | "eyeOff"
  | "google"
  | "send";

type AuthGlyphProps = {
  name: AuthGlyphName;
  size?: number;
  color?: string;
};

export function AuthGlyph({
  name,
  size = 24,
  color = "#7F94C0"
}: AuthGlyphProps) {
  if (name === "google") {
    return (
      <Text
        style={[
          styles.googleText,
          {
            color,
            fontSize: size
          }
        ]}
      >
        G
      </Text>
    );
  }

  return (
    <View style={{ width: size, height: size }}>
      {name === "user" ? <UserGlyph color={color} size={size} /> : null}
      {name === "mail" ? <MailGlyph color={color} size={size} /> : null}
      {name === "phone" ? <PhoneGlyph color={color} size={size} /> : null}
      {name === "lock" ? <LockGlyph color={color} size={size} /> : null}
      {name === "eye" ? <EyeGlyph color={color} size={size} slashed={false} /> : null}
      {name === "eyeOff" ? <EyeGlyph color={color} size={size} slashed /> : null}
      {name === "send" ? <SendGlyph color={color} size={size} /> : null}
    </View>
  );
}

function UserGlyph({ color, size }: { color: string; size: number }) {
  return (
    <>
      <View
        style={[
          styles.userHead,
          {
            borderColor: color,
            width: size * 0.4,
            height: size * 0.4,
            borderRadius: size * 0.2,
            left: size * 0.3,
            top: size * 0.08
          }
        ]}
      />
      <View
        style={[
          styles.userBody,
          {
            borderColor: color,
            width: size * 0.72,
            height: size * 0.34,
            borderTopLeftRadius: size * 0.3,
            borderTopRightRadius: size * 0.3,
            borderBottomLeftRadius: size * 0.08,
            borderBottomRightRadius: size * 0.08,
            left: size * 0.14,
            top: size * 0.54
          }
        ]}
      />
    </>
  );
}

function MailGlyph({ color, size }: { color: string; size: number }) {
  return (
    <>
      <View
        style={[
          styles.mailBox,
          {
            borderColor: color,
            width: size * 0.84,
            height: size * 0.62,
            borderRadius: size * 0.08,
            left: size * 0.08,
            top: size * 0.18
          }
        ]}
      />
      <View
        style={[
          styles.mailLineLeft,
          {
            backgroundColor: color,
            width: size * 0.36,
            left: size * 0.12,
            top: size * 0.34,
            transform: [{ rotate: "34deg" }]
          }
        ]}
      />
      <View
        style={[
          styles.mailLineRight,
          {
            backgroundColor: color,
            width: size * 0.36,
            right: size * 0.12,
            top: size * 0.34,
            transform: [{ rotate: "-34deg" }]
          }
        ]}
      />
    </>
  );
}

function PhoneGlyph({ color, size }: { color: string; size: number }) {
  return (
    <>
      <View
        style={[
          styles.phoneArc,
          {
            borderColor: color,
            width: size * 0.5,
            height: size * 0.72,
            left: size * 0.24,
            top: size * 0.1
          }
        ]}
      />
      <View
        style={[
          styles.phoneTipTop,
          {
            backgroundColor: color,
            width: size * 0.18,
            height: size * 0.08,
            left: size * 0.18,
            top: size * 0.16,
            transform: [{ rotate: "-34deg" }]
          }
        ]}
      />
      <View
        style={[
          styles.phoneTipBottom,
          {
            backgroundColor: color,
            width: size * 0.18,
            height: size * 0.08,
            right: size * 0.18,
            bottom: size * 0.16,
            transform: [{ rotate: "-34deg" }]
          }
        ]}
      />
    </>
  );
}

function LockGlyph({ color, size }: { color: string; size: number }) {
  return (
    <>
      <View
        style={[
          styles.lockShackle,
          {
            borderColor: color,
            width: size * 0.42,
            height: size * 0.34,
            borderRadius: size * 0.18,
            left: size * 0.29,
            top: size * 0.04
          }
        ]}
      />
      <View
        style={[
          styles.lockBody,
          {
            borderColor: color,
            width: size * 0.78,
            height: size * 0.5,
            borderRadius: size * 0.12,
            left: size * 0.11,
            top: size * 0.36
          }
        ]}
      />
      <View
        style={[
          styles.lockKeyhole,
          {
            backgroundColor: color,
            width: size * 0.08,
            height: size * 0.16,
            borderRadius: size * 0.04,
            left: size * 0.46,
            top: size * 0.56
          }
        ]}
      />
    </>
  );
}

function EyeGlyph({
  color,
  size,
  slashed
}: {
  color: string;
  size: number;
  slashed: boolean;
}) {
  return (
    <>
      <View
        style={[
          styles.eyeOutline,
          {
            borderColor: color,
            width: size * 0.84,
            height: size * 0.54,
            borderRadius: size * 0.3,
            left: size * 0.08,
            top: size * 0.23
          }
        ]}
      />
      <View
        style={[
          styles.eyePupil,
          {
            backgroundColor: color,
            width: size * 0.16,
            height: size * 0.16,
            borderRadius: size * 0.08,
            left: size * 0.42,
            top: size * 0.42
          }
        ]}
      />
      {slashed ? (
        <View
          style={[
            styles.eyeSlash,
            {
              backgroundColor: color,
              width: size * 0.96,
              left: size * 0.02,
              top: size * 0.48
            }
          ]}
        />
      ) : null}
    </>
  );
}

function SendGlyph({ color, size }: { color: string; size: number }) {
  return (
    <>
      <View
        style={[
          styles.sendWingMain,
          {
            borderLeftColor: color,
            borderTopColor: "transparent",
            borderBottomColor: "transparent",
            borderLeftWidth: size * 0.6,
            borderTopWidth: size * 0.24,
            borderBottomWidth: size * 0.24,
            left: size * 0.14,
            top: size * 0.12
          }
        ]}
      />
      <View
        style={[
          styles.sendWingInner,
          {
            backgroundColor: colors.white,
            width: size * 0.34,
            left: size * 0.18,
            top: size * 0.44,
            transform: [{ rotate: "24deg" }]
          }
        ]}
      />
    </>
  );
}

const styles = StyleSheet.create({
  googleText: {
    textAlign: "center",
    ...fontStyles.extraBold
  },
  userHead: {
    position: "absolute",
    borderWidth: 2
  },
  userBody: {
    position: "absolute",
    borderWidth: 2,
    borderBottomWidth: 0
  },
  mailBox: {
    position: "absolute",
    borderWidth: 2
  },
  mailLineLeft: {
    position: "absolute",
    height: 2
  },
  mailLineRight: {
    position: "absolute",
    height: 2
  },
  phoneArc: {
    position: "absolute",
    borderWidth: 2,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderRadius: 999
  },
  phoneTipTop: {
    position: "absolute",
    borderRadius: 2
  },
  phoneTipBottom: {
    position: "absolute",
    borderRadius: 2
  },
  lockShackle: {
    position: "absolute",
    borderWidth: 2,
    borderBottomWidth: 0
  },
  lockBody: {
    position: "absolute",
    borderWidth: 2
  },
  lockKeyhole: {
    position: "absolute"
  },
  eyeOutline: {
    position: "absolute",
    borderWidth: 2
  },
  eyePupil: {
    position: "absolute"
  },
  eyeSlash: {
    position: "absolute",
    height: 2,
    transform: [{ rotate: "-30deg" }]
  },
  sendWingMain: {
    position: "absolute",
    width: 0,
    height: 0,
    borderStyle: "solid"
  },
  sendWingInner: {
    position: "absolute",
    height: 2
  }
});
