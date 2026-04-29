import { Stack } from "expo-router";

import { RoleGate } from "@/features/auth";

export default function ClinicLayout() {
  return (
    <RoleGate allowedRoles={["clinic_admin"]}>
      <Stack screenOptions={{ headerShown: false }} />
    </RoleGate>
  );
}
