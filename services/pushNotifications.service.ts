import * as Device from "expo-device";
import * as Notifications from "expo-notifications";

export type PushRegistrationResult = {
  status: "registered" | "denied" | "unavailable";
  expoPushToken: string | null;
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true
  })
});

export async function registerForPushNotifications(): Promise<
  PushRegistrationResult
> {
  if (!Device.isDevice) {
    return {
      status: "unavailable",
      expoPushToken: null
    };
  }

  const existingPermissions = await Notifications.getPermissionsAsync();
  let finalStatus = existingPermissions.status;

  if (existingPermissions.status !== "granted") {
    const requestedPermissions =
      await Notifications.requestPermissionsAsync();
    finalStatus = requestedPermissions.status;
  }

  if (finalStatus !== "granted") {
    return {
      status: "denied",
      expoPushToken: null
    };
  }

  const token = await Notifications.getExpoPushTokenAsync();

  return {
    status: "registered",
    expoPushToken: token.data
  };
}

export async function setAppNotificationBadge(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

export function addPushNotificationListeners({
  onReceived,
  onResponse
}: {
  onReceived?: (notification: Notifications.Notification) => void;
  onResponse?: (response: Notifications.NotificationResponse) => void;
}) {
  const receivedSubscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      onReceived?.(notification);
    }
  );
  const responseSubscription =
    Notifications.addNotificationResponseReceivedListener((response) => {
      onResponse?.(response);
    });

  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
}
