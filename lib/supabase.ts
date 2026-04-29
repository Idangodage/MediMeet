import "react-native-url-polyfill/auto";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { env, hasRequiredEnvVars } from "@/lib/env";
import { secureStoreAdapter } from "@/lib/secureStoreAdapter";
import type { Database } from "@/types/supabase";

export const isSupabaseConfigured = hasRequiredEnvVars();

export const supabase: SupabaseClient<Database> | null = isSupabaseConfigured
  ? createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: false,
        persistSession: true,
        storage: secureStoreAdapter
      }
    })
  : null;

export function getSupabase(): SupabaseClient<Database> {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your .env file, then restart Expo with cache cleared."
    );
  }

  return supabase;
}
