export const colors = {
  background: "#F7FAFC",
  backgroundSoft: "#EFF7F6",
  surface: "#FFFFFF",
  surfaceElevated: "#FFFFFF",
  surfaceMuted: "#EEF5F7",
  border: "#D7E5EA",
  borderStrong: "#B9CDD4",
  text: "#102A35",
  textMuted: "#5F7480",
  textSubtle: "#7B8F99",
  primary: "#087C89",
  primaryDark: "#055865",
  primarySoft: "#DDF4F6",
  primaryTint: "#F0FBFC",
  accent: "#315F72",
  accentSoft: "#E7F0F3",
  danger: "#B42318",
  dangerSoft: "#FDE8E6",
  warning: "#A15C00",
  warningSoft: "#FFF3D6",
  success: "#067647",
  successSoft: "#DDF9E8",
  info: "#175CD3",
  infoSoft: "#E8F1FF",
  focus: "#13A1B1",
  shadow: "rgba(16, 42, 53, 0.12)",
  white: "#FFFFFF"
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  "3xl": 48
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 22,
  xl: 30,
  full: 999
} as const;

export const typography = {
  hero: 38,
  title: 30,
  subtitle: 19,
  body: 16,
  small: 13,
  tiny: 11
} as const;

export const shadows = {
  card: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 3
  },
  soft: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.7,
    shadowRadius: 16,
    elevation: 2
  }
} as const;
