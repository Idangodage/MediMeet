import { router } from "expo-router";

import { Screen } from "@/components/Screen";
import { EmptyState } from "@/components/ui";

export default function NotFoundScreen() {
  return (
    <Screen scroll={false}>
      <EmptyState
        title="Page not found"
        message="This MediMeet route does not exist."
        actionLabel="Go home"
        onAction={() => router.replace("/")}
      />
    </Screen>
  );
}
