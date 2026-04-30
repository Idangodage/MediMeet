import { Stack } from "expo-router";

import { RoleGate } from "@/features/auth";

export default function DoctorLayout() {
  return (
    <RoleGate allowedRoles={["doctor"]}>
      <Stack screenOptions={{ headerShown: false }} />
    </RoleGate>
  );
}
