import Constants from "expo-constants";

const extra = (Constants.expoConfig?.extra ?? {}) as Record<
  string,
  string | undefined
>;

export const env = {
  appEnv:
    process.env.EXPO_PUBLIC_APP_ENV ??
    extra.EXPO_PUBLIC_APP_ENV ??
    extra.appEnv ??
    "development",
  supabaseUrl:
    process.env.EXPO_PUBLIC_SUPABASE_URL ??
    extra.EXPO_PUBLIC_SUPABASE_URL ??
    "",
  supabaseAnonKey:
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
    extra.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
    ""
} as const;

export function getMissingEnvVars(): string[] {
  const requiredEnv = {
    EXPO_PUBLIC_SUPABASE_URL: env.supabaseUrl,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: env.supabaseAnonKey
  };

  return Object.entries(requiredEnv)
    .filter(([, value]) => !value)
    .map(([key]) => key);
}

export function hasRequiredEnvVars(): boolean {
  return getMissingEnvVars().length === 0;
}

export function assertEnv(): void {
  const missingEnvVars = getMissingEnvVars();

  if (missingEnvVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingEnvVars.join(", ")}`
    );
  }
}
