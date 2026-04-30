import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, StyleSheet, Text, View } from "react-native";

import { Badge, Button, EmptyState } from "@/components/ui";
import { colors, radius, spacing, typography } from "@/constants/theme";
import {
  formatNotificationDate,
  getNotificationEventLabel,
  getNotificationTypeLabel,
  markNotificationAsRead,
  type AppNotification
} from "@/services/notification.service";

type NotificationListProps = {
  notifications: AppNotification[];
  emptyTitle?: string;
  emptyMessage?: string;
};

export function NotificationList({
  notifications,
  emptyMessage = "Appointment, verification, billing, and system updates will appear here.",
  emptyTitle = "No notifications"
}: NotificationListProps) {
  const queryClient = useQueryClient();
  const markReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: invalidateNotifications(queryClient),
    onError: (error) => {
      Alert.alert(
        "Unable to update notification",
        error instanceof Error ? error.message : "Please try again."
      );
    }
  });

  if (notifications.length === 0) {
    return <EmptyState title={emptyTitle} message={emptyMessage} />;
  }

  return (
    <View style={styles.list}>
      {notifications.map((notification) => (
        <View key={notification.id} style={styles.item}>
          <View style={styles.copy}>
            <View style={styles.badgeRow}>
              <Badge
                label={
                  getNotificationEventLabel(notification.event) ??
                  getNotificationTypeLabel(notification.type)
                }
                variant="neutral"
              />
              <Badge
                label={notification.readStatus === "read" ? "Read" : "Unread"}
                variant={
                  notification.readStatus === "read" ? "neutral" : "success"
                }
              />
            </View>
            <Text style={styles.title}>{notification.title}</Text>
            <Text style={styles.body}>{notification.body}</Text>
            <Text style={styles.meta}>
              {formatNotificationDate(notification.createdAt)}
            </Text>
          </View>
          {notification.readStatus === "unread" ? (
            <Button
              title="Mark read"
              variant="secondary"
              isLoading={markReadMutation.isPending}
              onPress={() => markReadMutation.mutate(notification.id)}
            />
          ) : null}
        </View>
      ))}
    </View>
  );
}

export function invalidateNotifications(
  queryClient: ReturnType<typeof useQueryClient>
) {
  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["own-notifications"] }),
      queryClient.invalidateQueries({ queryKey: ["notifications"] }),
      queryClient.invalidateQueries({ queryKey: ["unread-notifications"] })
    ]);
  };
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md
  },
  item: {
    gap: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    padding: spacing.md
  },
  copy: {
    gap: spacing.sm
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  title: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  body: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24
  },
  meta: {
    color: colors.textMuted,
    fontSize: typography.small,
    fontWeight: "800"
  }
});
