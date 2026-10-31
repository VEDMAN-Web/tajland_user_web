import { z } from "zod";

// `NotificationItemDto`: one entry of the bell list. `type` and `data` match the push payload
// (HELP_SUPPORT_TICKET: { ticketId, ticketNo }, CERTIFICATE_READY: { orderId, certificateNo }).
export const notificationSchema = z.object({
  id: z.string().min(1),
  type: z.string(),
  // A missing text field becomes "" rather than failing the whole list.
  title: z.string().nullish().transform((value) => value ?? ""),
  message: z.string().nullish().transform((value) => value ?? ""),
  data: z.unknown().optional(),
  isRead: z.boolean(),
  createdAt: z.string().nullish().transform((value) => value ?? ""),
});

// `GET /notifications` `data`; `unreadCount` ignores the `isRead` filter.
export const notificationsPageSchema = z.object({
  items: z.array(notificationSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
  unreadCount: z.number().int().nonnegative(),
});

export type AppNotification = z.infer<typeof notificationSchema>;
export type NotificationsPage = z.infer<typeof notificationsPageSchema>;
