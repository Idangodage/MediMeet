export const fontFamilies = {
  regular: "PlusJakartaSans_400Regular",
  medium: "PlusJakartaSans_500Medium",
  semiBold: "PlusJakartaSans_600SemiBold",
  bold: "PlusJakartaSans_700Bold",
  extraBold: "PlusJakartaSans_800ExtraBold"
} as const;

export const fontStyles = {
  regular: {
    fontFamily: fontFamilies.regular
  },
  medium: {
    fontFamily: fontFamilies.medium
  },
  semiBold: {
    fontFamily: fontFamilies.semiBold
  },
  bold: {
    fontFamily: fontFamilies.bold
  },
  extraBold: {
    fontFamily: fontFamilies.extraBold
  }
} as const;
