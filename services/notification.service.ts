import { getSupabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

export type NotificationType =
  Database["public"]["Enums"]["notification_type"];
export type NotificationReadStatus =
  Database["public"]["Enums"]["notification_read_status"];
export type NotificationEvent =
  Database["public"]["Enums"]["notification_event"];

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  event: NotificationEvent | null;
  readStatus: NotificationReadStatus;
  createdAt: string;
};

export async function listOwnNotifications(
  limit?: number
): Promise<AppNotification[]> {
  const supabase = getSupabase();
  let query = supabase
    .from("notifications")
    .select("id, title, body, type, event, read_status, created_at")
    .order("created_at", { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []).map((notification) => ({
    id: notification.id,
    title: notification.title,
    body: notification.body,
    type: notification.type,
    event: notification.event,
    readStatus: notification.read_status,
    createdAt: notification.created_at
  }));
}

export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = getSupabase();
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("read_status", "unread");

  if (error) {
    throw error;
  }

  return count ?? 0;
}

export async function markNotificationAsRead(
  notificationId: string
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("notifications")
    .update({ read_status: "read" })
    .eq("id", notificationId);

  if (error) {
    throw error;
  }
}

export async function markAllNotificationsAsRead(): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("notifications")
    .update({ read_status: "read" })
    .eq("read_status", "unread");

  if (error) {
    throw error;
  }
}

export function getNotificationTypeLabel(type: NotificationType): string {
  if (type === "appointment") {
    return "Appointment";
  }

  if (type === "verification") {
    return "Verification";
  }

  if (type === "subscription") {
    return "Subscription";
  }

  if (type === "payment") {
    return "Payment";
  }

  return "System";
}

export function getNotificationEventLabel(event: NotificationEvent | null) {
  if (!event) {
    return null;
  }

  return event
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatNotificationDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
