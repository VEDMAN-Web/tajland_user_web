import { z } from "zod";
import { authedDelete, authedGet, authedPatch, authedPost } from "@/lib/api/browser-client";
import { notificationsPageSchema, type NotificationsPage } from "../schemas/notifications.schema";

// The read and delete endpoints document only that they succeeded.
const acknowledgedSchema = z.unknown();

/**
 * Records this browser's OneSignal subscription id for the signed-in user
 * (`POST /notifications/push-token`). Delivery still goes through `OneSignal.login(userId)`;
 * this only lets the backend see the device. Re-sending the same token is a harmless update.
 */
export function registerPushToken(pushToken: string): Promise<unknown> {
  return authedPost("/notifications/push-token", { pushToken, platform: "WEB" }, acknowledgedSchema);
}

/** The signed-in user's notifications, newest first (`GET /notifications`). */
export function getNotifications(
  query: { page?: number; limit?: number; isRead?: boolean },
  signal?: AbortSignal,
): Promise<NotificationsPage> {
  return authedGet("/notifications", notificationsPageSchema, { signal, query });
}

/** Marks one notification read (`PATCH /notifications/{id}/read`); safe to repeat. */
export function markNotificationRead(notificationId: string): Promise<unknown> {
  return authedPatch(`/notifications/${encodeURIComponent(notificationId)}/read`, {}, acknowledgedSchema);
}

/** Marks every unread notification read (`PATCH /notifications/read-all`). */
export function markAllNotificationsRead(): Promise<unknown> {
  return authedPatch("/notifications/read-all", {}, acknowledgedSchema);
}

/** Permanently deletes one notification (`DELETE /notifications/{id}`); 404 when it is gone already. */
export function deleteNotification(notificationId: string): Promise<unknown> {
  return authedDelete(`/notifications/${encodeURIComponent(notificationId)}`, acknowledgedSchema);
}

/** Permanently deletes all of the user's notifications (`DELETE /notifications`). */
export function clearAllNotifications(): Promise<unknown> {
  return authedDelete("/notifications", acknowledgedSchema);
}
