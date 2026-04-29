import { Stack } from "expo-router";

import { RoleGate } from "@/features/auth";

export default function AdminLayout() {
  return (
    <RoleGate allowedRoles={["platform_admin"]}>
      <Stack screenOptions={{ headerShown: false }} />
    </RoleGate>
  );
}
