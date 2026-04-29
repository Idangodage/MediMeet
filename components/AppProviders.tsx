import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider } from "@/features/auth/context/AuthProvider";
import { isSupabaseConfigured } from "@/lib/supabase";
import { queryClient } from "@/lib/queryClient";
import { SupabaseSetupScreen } from "@/components/SupabaseSetupScreen";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        {isSupabaseConfigured ? (
          <AuthProvider>{children}</AuthProvider>
        ) : (
          <SupabaseSetupScreen />
        )}
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
