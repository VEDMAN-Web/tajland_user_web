import { z } from "zod";

// Backend limit for `POST /help-support` `query`.
export const SUPPORT_QUERY_MAX_LENGTH = 1000;

// One support ticket; `answer` is "" until the team replies.
export const supportTicketSchema = z.object({
  _id: z.string().min(1),
  query: z.string(),
  answer: z.string().nullish(),
  createdAt: z.string(),
  updatedAt: z.string().nullish(),
});

// `GET /help-support` `data`: the user's tickets, newest first.
export const supportTicketsSchema = z.array(supportTicketSchema);

export type SupportTicket = z.infer<typeof supportTicketSchema>;
