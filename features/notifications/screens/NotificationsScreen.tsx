import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { Alert, StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/Screen";
import {
  Badge,
  Button,
  Card,
  ErrorState,
  LoadingState
} from "@/components/ui";
import { getHomeRouteForRole } from "@/constants/routes";
import { colors, spacing, typography } from "@/constants/theme";
import { useAuth } from "@/features/auth";
import {
  getUnreadNotificationCount,
  listOwnNotifications,
  markAllNotificationsAsRead
} from "@/services/notification.service";
import {
  invalidateNotifications,
  NotificationList
} from "../components/NotificationList";

export function NotificationsScreen() {
  const { role } = useAuth();
  const queryClient = useQueryClient();
  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: () => listOwnNotifications()
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
    <Screen>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>Notification center</Text>
          <Text style={styles.title}>In-app notifications</Text>
          <Text style={styles.subtitle}>
            Appointment, verification, subscription, payment, and system events
            are stored in the Supabase notifications table.
          </Text>
        </View>
        <Badge
          label={`${unreadCount} unread`}
          variant={unreadCount > 0 ? "success" : "neutral"}
        />
      </View>

      <Card>
        <View style={styles.actions}>
          {unreadCount > 0 ? (
            <Button
              title="Mark all as read"
              isLoading={markAllMutation.isPending}
              onPress={() => markAllMutation.mutate()}
            />
          ) : null}
          <Button
            title="Back to dashboard"
            variant="secondary"
            onPress={() => router.push(getHomeRouteForRole(role))}
          />
        </View>
      </Card>

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
        <Card>
          <NotificationList notifications={notificationsQuery.data} />
        </Card>
      ) : null}
    </Screen>
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
    gap: spacing.sm
  },
  eyebrow: {
    color: colors.primary,
    fontSize: typography.small,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "900",
    lineHeight: 34
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24
  },
  actions: {
    gap: spacing.sm
  }
});
