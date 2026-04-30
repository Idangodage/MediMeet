import { GuestOnlyRoute } from "@/features/auth";
import { EmailVerificationScreen } from "@/features/auth/screens/EmailVerificationScreen";

export default function EmailVerificationRoute() {
  return (
    <GuestOnlyRoute>
      <EmailVerificationScreen />
    </GuestOnlyRoute>
  );
}
