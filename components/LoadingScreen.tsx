import { Screen } from "@/components/Screen";
import { LoadingState } from "@/components/ui";

type LoadingScreenProps = {
  message?: string;
};

export function LoadingScreen({
  message = "Preparing MediMeet..."
}: LoadingScreenProps) {
  return (
    <Screen scroll={false}>
      <LoadingState message={message} />
    </Screen>
  );
}
