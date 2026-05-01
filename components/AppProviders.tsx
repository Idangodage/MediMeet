import type { ReactNode } from "react";
import { useEffect } from "react";
import { Text, TextInput } from "react-native";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts
} from "@expo-google-fonts/plus-jakarta-sans";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider } from "@/features/auth/context/AuthProvider";
import { isSupabaseConfigured } from "@/lib/supabase";
import { queryClient } from "@/lib/queryClient";
import { fontFamilies } from "@/constants/fonts";
import { LoadingScreen } from "@/components/LoadingScreen";
import { SupabaseSetupScreen } from "@/components/SupabaseSetupScreen";

type AppProvidersProps = {
  children: ReactNode;
};

let hasConfiguredGlobalTypography = false;

function mergeDefaultStyle(
  existingStyle: unknown,
  nextStyle: { fontFamily: string }
) {
  if (!existingStyle) {
    return nextStyle;
  }

  return Array.isArray(existingStyle)
    ? [nextStyle, ...existingStyle]
    : [nextStyle, existingStyle];
}

function configureGlobalTypography() {
  if (hasConfiguredGlobalTypography) {
    return;
  }

  const TextComponent = Text as typeof Text & {
    defaultProps?: { style?: unknown };
  };
  const TextInputComponent = TextInput as typeof TextInput & {
    defaultProps?: { style?: unknown };
  };

  TextComponent.defaultProps = {
    ...TextComponent.defaultProps,
    style: mergeDefaultStyle(TextComponent.defaultProps?.style, {
      fontFamily: fontFamilies.regular
    })
  };
  TextInputComponent.defaultProps = {
    ...TextInputComponent.defaultProps,
    style: mergeDefaultStyle(TextInputComponent.defaultProps?.style, {
      fontFamily: fontFamilies.regular
    })
  };

  hasConfiguredGlobalTypography = true;
}

export function AppProviders({ children }: AppProvidersProps) {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold
  });

  useEffect(() => {
    if (fontsLoaded) {
      configureGlobalTypography();
    }
  }, [fontsLoaded]);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        {!fontsLoaded ? (
          <LoadingScreen />
        ) : isSupabaseConfigured ? (
          <AuthProvider>{children}</AuthProvider>
        ) : (
          <SupabaseSetupScreen />
        )}
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
