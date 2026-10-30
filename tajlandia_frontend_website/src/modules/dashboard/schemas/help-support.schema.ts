import { z } from "zod";

// Backend limits for `POST /help-support` and `POST /help-support/{ticketId}/messages`.
export const SUPPORT_SUBJECT_MAX_LENGTH = 150;
export const SUPPORT_CATEGORY_MAX_LENGTH = 50;
export const SUPPORT_MESSAGE_MAX_LENGTH = 2000;

// Ticket status, in the order the filter chips show them.
export const SUPPORT_STATUSES = ["OPEN", "IN_PROGRESS", "PENDING", "CLOSED"] as const;
export type SupportStatus = (typeof SUPPORT_STATUSES)[number];

// `SupportTicketSummaryDto`: one ticket in the list (also what creating one returns).
export const supportTicketSchema = z.object({
  _id: z.string().min(1),
  // A missing text field becomes "" rather than failing the whole list.
  ticketNo: z.string().nullish().transform((value) => value ?? ""),
  subject: z.string().nullish().transform((value) => value ?? ""),
  category: z.string().nullish(),
  status: z.string().nullish().transform((value) => value ?? "OPEN"),
  createdAt: z.string().nullish().transform((value) => value ?? ""),
  lastMessageAt: z.string().nullish(),
});

const supportTicketListSchema = z.array(supportTicketSchema);

// `GET /help-support` `data`. Swagger says an array; a paged object (the list under `items`,
// `tickets`, `data`, `results` or `docs`) is accepted too, so a pagination change doesn't blank the page.
export const supportTicketsSchema = z.unknown().transform((data, ctx) => {
  const list = Array.isArray(data)
    ? data
    : isRecord(data)
      ? ["items", "tickets", "data", "results", "docs"].map((key) => data[key]).find(Array.isArray)
      : undefined;
  const parsed = supportTicketListSchema.safeParse(list);
  if (!parsed.success) {
    ctx.addIssue({ code: "custom", message: "Unexpected ticket list shape" });
    return z.NEVER;
  }
  return parsed.data;
});

// One message in a ticket's conversation.
export type SupportMessage = {
  id: string;
  text: string;
  createdAt: string;
  /** True when the support team wrote it, false when the signed-in user did. */
  fromSupport: boolean;
};

export type SupportTicketDetail = {
  ticket: z.infer<typeof supportTicketSchema>;
  messages: SupportMessage[];
};

const SUPPORT_SENDER = /admin|support|staff|agent|team/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// The list of messages, whether the API sends it bare or wrapped (`{ items }`, `{ data }`).
function messageList(value: unknown): unknown[] | null {
  if (Array.isArray(value)) return value;
  if (isRecord(value)) {
    for (const key of ["items", "data", "messages"]) {
      const inner = value[key];
      if (Array.isArray(inner)) return inner;
    }
  }
  return null;
}

function toMessage(value: unknown, index: number): SupportMessage | null {
  if (!isRecord(value)) return null;
  const text = [value.message, value.text, value.content, value.body].find(
    (entry): entry is string => typeof entry === "string",
  );
  if (text === undefined) return null;
  const createdAt = typeof value.createdAt === "string" ? value.createdAt : "";
  // The sender may come as a role string on any of these keys, or as a flag.
  const senderValues = [value.senderType, value.senderRole, value.sender, value.role, value.authorType, value.from];
  const fromSupport =
    value.isAdmin === true ||
    value.isStaff === true ||
    value.isSupport === true ||
    senderValues.some((entry) => typeof entry === "string" && SUPPORT_SENDER.test(entry)) ||
    (isRecord(value.sender) && typeof value.sender.role === "string" && SUPPORT_SENDER.test(value.sender.role));
  const id = typeof value._id === "string" ? value._id : typeof value.id === "string" ? value.id : `${createdAt}-${index}`;
  return { id, text, createdAt, fromSupport };
}

// `GET /help-support/{ticketId}` `data`. Swagger gives no schema for it, so this accepts
// the ticket fields at the top level or under `ticket`, and the conversation under
// `messages` / `conversation` (bare or wrapped), oldest first.
export const supportTicketDetailSchema = z.custom<Record<string, unknown>>(isRecord).transform((raw, ctx) => {
  const head = isRecord(raw.ticket) ? raw.ticket : raw;
  const ticket = supportTicketSchema.safeParse(head);
  if (!ticket.success) {
    ctx.addIssue({ code: "custom", message: "Unexpected ticket shape" });
    return z.NEVER;
  }
  const list = messageList(raw.messages) ?? messageList(raw.conversation) ?? messageList(head.messages) ?? messageList(head.conversation) ?? [];
  const messages = list.map(toMessage).filter((message): message is SupportMessage => message !== null);
  return { ticket: ticket.data, messages } satisfies SupportTicketDetail;
});

export type SupportTicket = z.infer<typeof supportTicketSchema>;
