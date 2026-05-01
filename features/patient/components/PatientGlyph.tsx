import { StyleSheet, Text, View } from "react-native";

import { fontStyles } from "@/constants/fonts";
import { colors } from "@/constants/theme";

type PatientGlyphName =
  | "search"
  | "calendar"
  | "location"
  | "bell"
  | "filter"
  | "heart"
  | "support"
  | "home"
  | "bookmark"
  | "leaf"
  | "shield"
  | "globe"
  | "user";

type PatientGlyphProps = {
  name: PatientGlyphName;
  size?: number;
  color?: string;
};

export function PatientGlyph({
  name,
  size = 24,
  color = "#153067"
}: PatientGlyphProps) {
  if (name === "search") {
    return (
      <View style={{ width: size, height: size }}>
        <View
          style={[
            styles.searchCircle,
            {
              width: size * 0.58,
              height: size * 0.58,
              borderRadius: size * 0.29,
              borderColor: color,
              left: size * 0.08,
              top: size * 0.08
            }
          ]}
        />
        <View
          style={[
            styles.searchHandle,
            {
              width: size * 0.34,
              left: size * 0.48,
              top: size * 0.58,
              backgroundColor: color
            }
          ]}
        />
      </View>
    );
  }

  if (name === "calendar") {
    return (
      <View style={{ width: size, height: size }}>
        <View
          style={[
            styles.calendarBody,
            {
              width: size * 0.78,
              height: size * 0.72,
              left: size * 0.11,
              top: size * 0.18,
              borderColor: color,
              borderRadius: size * 0.12
            }
          ]}
        />
        <View
          style={[
            styles.calendarBar,
            {
              width: size * 0.78,
              left: size * 0.11,
              top: size * 0.34,
              backgroundColor: color
            }
          ]}
        />
      </View>
    );
  }

  if (name === "location") {
    return (
      <View style={{ width: size, height: size }}>
        <View
          style={[
            styles.pinHead,
            {
              width: size * 0.46,
              height: size * 0.46,
              left: size * 0.27,
              top: size * 0.08,
              borderRadius: size * 0.23,
              borderColor: color
            }
          ]}
        />
        <View
          style={[
            styles.pinTail,
            {
              width: size * 0.12,
              height: size * 0.34,
              left: size * 0.44,
              top: size * 0.44,
              backgroundColor: color
            }
          ]}
        />
      </View>
    );
  }

  if (name === "bell") {
    return (
      <View style={{ width: size, height: size }}>
        <View
          style={[
            styles.bellBody,
            {
              width: size * 0.62,
              height: size * 0.52,
              left: size * 0.19,
              top: size * 0.18,
              borderColor: color,
              borderTopLeftRadius: size * 0.32,
              borderTopRightRadius: size * 0.32,
              borderBottomLeftRadius: size * 0.12,
              borderBottomRightRadius: size * 0.12
            }
          ]}
        />
        <View
          style={[
            styles.bellDot,
            {
              width: size * 0.12,
              height: size * 0.12,
              left: size * 0.44,
              top: size * 0.74,
              borderRadius: size * 0.06,
              backgroundColor: color
            }
          ]}
        />
      </View>
    );
  }

  if (name === "filter") {
    return (
      <View style={{ width: size, height: size }}>
        {[0.22, 0.48, 0.74].map((row, index) => (
          <View
            key={index}
            style={[
              styles.filterLine,
              {
                left: size * 0.1,
                right: size * 0.1,
                top: size * row,
                backgroundColor: color
              }
            ]}
          />
        ))}
      </View>
    );
  }

  if (name === "heart") {
    return (
      <View style={{ width: size, height: size }}>
        <View
          style={[
            styles.heartLobe,
            {
              width: size * 0.34,
              height: size * 0.34,
              left: size * 0.14,
              top: size * 0.14,
              borderRadius: size * 0.17,
              borderColor: color
            }
          ]}
        />
        <View
          style={[
            styles.heartLobe,
            {
              width: size * 0.34,
              height: size * 0.34,
              left: size * 0.42,
              top: size * 0.14,
              borderRadius: size * 0.17,
              borderColor: color
            }
          ]}
        />
        <View
          style={[
            styles.heartPoint,
            {
              width: size * 0.34,
              height: size * 0.34,
              left: size * 0.33,
              top: size * 0.34,
              borderColor: color
            }
          ]}
        />
      </View>
    );
  }

  if (name === "support") {
    return (
      <Text style={[styles.symbolText, { color, fontSize: size * 0.92 }]}>
        ?
      </Text>
    );
  }

  if (name === "home") {
    return (
      <View style={{ width: size, height: size }}>
        <View
          style={[
            styles.homeRoof,
            {
              borderLeftColor: "transparent",
              borderRightColor: "transparent",
              borderBottomColor: color,
              borderLeftWidth: size * 0.28,
              borderRightWidth: size * 0.28,
              borderBottomWidth: size * 0.26,
              left: size * 0.1,
              top: size * 0.14
            }
          ]}
        />
        <View
          style={[
            styles.homeBody,
            {
              width: size * 0.52,
              height: size * 0.42,
              left: size * 0.24,
              top: size * 0.42,
              borderColor: color
            }
          ]}
        />
      </View>
    );
  }

  if (name === "bookmark") {
    return (
      <View style={{ width: size, height: size }}>
        <View
          style={[
            styles.bookmarkBody,
            {
              width: size * 0.5,
              height: size * 0.68,
              left: size * 0.25,
              top: size * 0.14,
              borderColor: color,
              borderRadius: size * 0.08
            }
          ]}
        />
      </View>
    );
  }

  if (name === "leaf") {
    return (
      <View style={{ width: size, height: size }}>
        <View
          style={[
            styles.leafBody,
            {
              width: size * 0.52,
              height: size * 0.72,
              left: size * 0.24,
              top: size * 0.08,
              borderColor: color,
              borderRadius: size * 0.3
            }
          ]}
        />
      </View>
    );
  }

  if (name === "shield") {
    return (
      <View style={{ width: size, height: size }}>
        <View
          style={[
            styles.shieldBody,
            {
              width: size * 0.58,
              height: size * 0.66,
              left: size * 0.21,
              top: size * 0.1,
              borderColor: color,
              borderTopLeftRadius: size * 0.16,
              borderTopRightRadius: size * 0.16,
              borderBottomLeftRadius: size * 0.26,
              borderBottomRightRadius: size * 0.26
            }
          ]}
        />
      </View>
    );
  }

  if (name === "globe") {
    return (
      <View style={{ width: size, height: size }}>
        <View
          style={[
            styles.globeCircle,
            {
              width: size * 0.72,
              height: size * 0.72,
              left: size * 0.14,
              top: size * 0.14,
              borderRadius: size * 0.36,
              borderColor: color
            }
          ]}
        />
        <View
          style={[
            styles.globeLine,
            {
              width: size * 0.56,
              left: size * 0.22,
              top: size * 0.48,
              backgroundColor: color
            }
          ]}
        />
      </View>
    );
  }

  return (
    <View style={{ width: size, height: size }}>
      <View
        style={[
          styles.userHead,
          {
            width: size * 0.3,
            height: size * 0.3,
            left: size * 0.35,
            top: size * 0.1,
            borderRadius: size * 0.15,
            borderColor: color
          }
        ]}
      />
      <View
        style={[
          styles.userBody,
          {
            width: size * 0.58,
            height: size * 0.32,
            left: size * 0.21,
            top: size * 0.48,
            borderTopLeftRadius: size * 0.24,
            borderTopRightRadius: size * 0.24,
            borderColor: color
          }
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  symbolText: {
    textAlign: "center",
    ...fontStyles.medium
  },
  searchCircle: {
    position: "absolute",
    borderWidth: 2
  },
  searchHandle: {
    position: "absolute",
    height: 2,
    transform: [{ rotate: "42deg" }]
  },
  calendarBody: {
    position: "absolute",
    borderWidth: 2
  },
  calendarBar: {
    position: "absolute",
    height: 2
  },
  pinHead: {
    position: "absolute",
    borderWidth: 2
  },
  pinTail: {
    position: "absolute",
    borderRadius: 3
  },
  bellBody: {
    position: "absolute",
    borderWidth: 2
  },
  bellDot: {
    position: "absolute"
  },
  filterLine: {
    position: "absolute",
    height: 2
  },
  heartLobe: {
    position: "absolute",
    borderWidth: 2
  },
  heartPoint: {
    position: "absolute",
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    transform: [{ rotate: "-45deg" }]
  },
  homeRoof: {
    position: "absolute",
    width: 0,
    height: 0,
    borderStyle: "solid"
  },
  homeBody: {
    position: "absolute",
    borderWidth: 2
  },
  bookmarkBody: {
    position: "absolute",
    borderWidth: 2
  },
  leafBody: {
    position: "absolute",
    borderWidth: 2
  },
  shieldBody: {
    position: "absolute",
    borderWidth: 2
  },
  globeCircle: {
    position: "absolute",
    borderWidth: 2
  },
  globeLine: {
    position: "absolute",
    height: 2
  },
  userHead: {
    position: "absolute",
    borderWidth: 2
  },
  userBody: {
    position: "absolute",
    borderWidth: 2,
    borderBottomWidth: 0
  }
});
