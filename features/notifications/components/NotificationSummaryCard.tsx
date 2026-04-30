import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { Alert, StyleSheet, Text, View } from "react-native";

import { Badge, Button, Card, ErrorState, LoadingState } from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { colors, spacing, typography } from "@/constants/theme";
import {
  getUnreadNotificationCount,
  listOwnNotifications,
  markAllNotificationsAsRead
} from "@/services/notification.service";
import {
  invalidateNotifications,
  NotificationList
} from "./NotificationList";

type NotificationSummaryCardProps = {
  limit?: number;
  subtitle?: string;
  title?: string;
};

export function NotificationSummaryCard({
  limit = 5,
  subtitle = "Recent appointment, verification, billing, and system updates.",
  title = "Notifications"
}: NotificationSummaryCardProps) {
  const queryClient = useQueryClient();
  const notificationsQuery = useQuery({
    queryKey: ["own-notifications", limit],
    queryFn: () => listOwnNotifications(limit)
  });
  const unreadQuery = useQuery({
    queryKey: ["unread-notifications"],
    queryFn: getUnreadNotificationCount
  });
  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: invalidateNotifications(queryClient),
    onError: (error) => {
      Alert.alert(
        "Unable to update notifications",
        error instanceof Error ? error.message : "Please try again."
      );
    }
  });
  const unreadCount = unreadQuery.data ?? 0;

  return (
    <Card>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        <Badge
          label={`${unreadCount} unread`}
          variant={unreadCount > 0 ? "success" : "neutral"}
        />
      </View>

      {notificationsQuery.isLoading ? (
        <LoadingState message="Loading notifications..." />
      ) : null}

      {notificationsQuery.isError ? (
        <ErrorState
          message={
            notificationsQuery.error instanceof Error
              ? notificationsQuery.error.message
              : "Unable to load notifications."
          }
          onRetry={() => void notificationsQuery.refetch()}
        />
      ) : null}

      {notificationsQuery.data ? (
        <NotificationList
          notifications={notificationsQuery.data}
          emptyMessage="New updates will appear here."
        />
      ) : null}

      <View style={styles.actions}>
        <Button
          title="View all notifications"
          onPress={() => router.push(ROUTES.notifications)}
        />
        {unreadCount > 0 ? (
          <Button
            title="Mark all read"
            variant="secondary"
            isLoading={markAllMutation.isPending}
            onPress={() => markAllMutation.mutate()}
          />
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  headerCopy: {
    flex: 1,
    gap: spacing.xs
  },
  title: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: "800"
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.small,
    lineHeight: 19
  },
  actions: {
    gap: spacing.sm
  }
});
