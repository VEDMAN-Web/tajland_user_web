import { authedGet, authedPost, authedPut } from "@/lib/api/browser-client";
import { z } from "zod";
import {
  supportTicketDetailSchema,
  supportTicketSchema,
  supportTicketsSchema,
  type SupportTicket,
  type SupportTicketDetail,
} from "../schemas/help-support.schema";

// The reply and close endpoints document no body; only that they succeeded matters.
const acknowledgedSchema = z.unknown();

/** The signed-in user's support tickets, most recent activity first (`GET /help-support`). */
export function getSupportTickets(signal?: AbortSignal): Promise<SupportTicket[]> {
  return authedGet("/help-support", supportTicketsSchema, { signal, query: { page: 1, limit: 100 } });
}

/** One ticket with its conversation, oldest message first (`GET /help-support/{ticketId}`). */
export function getSupportTicket(ticketId: string, signal?: AbortSignal): Promise<SupportTicketDetail> {
  return authedGet(`/help-support/${encodeURIComponent(ticketId)}`, supportTicketDetailSchema, {
    signal,
    query: { page: 1, limit: 100 },
  });
}

/** Opens a ticket (status OPEN); 400 when the subject/message is empty or too long. */
export function createSupportTicket(input: {
  subject: string;
  category?: string;
  message: string;
}): Promise<SupportTicket> {
  return authedPost("/help-support", input, supportTicketSchema);
}

/** Adds a reply (status becomes IN_PROGRESS); 400 when the ticket is closed. */
export function replyToSupportTicket(ticketId: string, message: string): Promise<unknown> {
  return authedPost(`/help-support/${encodeURIComponent(ticketId)}/messages`, { message }, acknowledgedSchema);
}

/** Closes the ticket; no replies are accepted afterwards. 400 when it is already closed. */
export function closeSupportTicket(ticketId: string): Promise<unknown> {
  return authedPut(`/help-support/${encodeURIComponent(ticketId)}/close`, {}, acknowledgedSchema);
}
