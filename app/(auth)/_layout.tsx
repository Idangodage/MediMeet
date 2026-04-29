import { Stack } from "expo-router";

import { GuestOnlyRoute } from "@/features/auth";

export default function AuthLayout() {
  return (
    <GuestOnlyRoute>
      <Stack screenOptions={{ headerShown: false }} />
    </GuestOnlyRoute>
  );
}
