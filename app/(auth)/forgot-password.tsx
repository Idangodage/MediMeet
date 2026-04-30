import { GuestOnlyRoute } from "@/features/auth";
import { ForgotPasswordScreen } from "@/features/auth/screens/ForgotPasswordScreen";

export default function ForgotPasswordRoute() {
  return (
    <GuestOnlyRoute>
      <ForgotPasswordScreen />
    </GuestOnlyRoute>
  );
}
