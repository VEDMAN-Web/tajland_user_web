import { authedGet, authedPost } from "@/lib/api/browser-client";
import {
  supportTicketSchema,
  supportTicketsSchema,
  type SupportTicket,
} from "../schemas/help-support.schema";

/** The signed-in user's support tickets, newest first. */
export function getSupportTickets(signal?: AbortSignal): Promise<SupportTicket[]> {
  return authedGet("/help-support", supportTicketsSchema, { signal });
}

/** Sends a new question; 400 when it is empty or over 1000 characters. */
export function createSupportTicket(query: string): Promise<SupportTicket> {
  return authedPost("/help-support", { query }, supportTicketSchema);
}
