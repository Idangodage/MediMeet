import { Stack } from "expo-router";

import { RoleGate } from "@/features/auth";

export default function PatientLayout() {
  return (
    <RoleGate allowedRoles={["patient"]}>
      <Stack screenOptions={{ headerShown: false }} />
    </RoleGate>
  );
}
