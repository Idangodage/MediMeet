import { RoleGate } from "@/features/auth";
import { NotificationsScreen } from "@/features/notifications";

export default function NotificationsRoute() {
  return (
    <RoleGate
      allowedRoles={["patient", "doctor", "clinic_admin", "platform_admin"]}
    >
      <NotificationsScreen />
    </RoleGate>
  );
}
