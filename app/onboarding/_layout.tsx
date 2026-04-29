import { Stack } from "expo-router";

import { RoleGate } from "@/features/auth";

export default function OnboardingLayout() {
  return (
    <RoleGate
      allowedRoles={["patient", "doctor", "clinic_admin"]}
      requireOnboarding={false}
    >
      <Stack screenOptions={{ headerShown: false }} />
    </RoleGate>
  );
}
