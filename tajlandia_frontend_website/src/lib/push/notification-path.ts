import { routes } from "@/lib/constants/routes";

function readString(data: unknown, key: string): string | null {
  if (typeof data !== "object" || data === null) return null;
  const value = (data as Record<string, unknown>)[key];
  return typeof value === "string" && value ? value : null;
}

/**
 * Where a notification leads, from its `type` and `data` (the same payload in the push and in
 * `GET /notifications`): a reply opens that ticket, a ready certificate opens its page.
 * Null for a type with no page (ADMIN_MESSAGE is a plain announcement) or one this app doesn't
 * know, so the click just marks it read.
 */
export function notificationPath(type: unknown, data: unknown): string | null {
  if (type === "HELP_SUPPORT_TICKET") {
    const ticketId = readString(data, "ticketId");
    return ticketId ? `${routes.helpSupport}?ticket=${encodeURIComponent(ticketId)}` : routes.helpSupport;
  }
  if (type === "CERTIFICATE_READY") {
    const orderId = readString(data, "orderId");
    return orderId ? `${routes.certificates}/${encodeURIComponent(orderId)}` : routes.certificates;
  }
  return null;
}

/** A push's own payload carries `type` next to the ids, so it is read from the one object. */
export function pushPath(additionalData: unknown): string | null {
  return notificationPath(readString(additionalData, "type"), additionalData);
}
