"use client";

import { Fragment, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { isAbortError } from "@/lib/api/browser-client";
import { isApiError } from "@/lib/api/errors";
import { useAuth } from "@/lib/hooks/useAuth";
import { logError } from "@/lib/logging/logger";
import {
  SUPPORT_MESSAGE_MAX_LENGTH,
  type SupportMessage,
  type SupportTicket,
  type SupportTicketDetail as SupportTicketDetailData,
} from "./schemas/help-support.schema";
import { closeSupportTicket, getSupportTicket, replyToSupportTicket } from "./services/help-support.client";

const card = "rounded-[20px] border border-[#e8edf5] bg-white shadow-[0_10px_32px_rgba(11,31,77,0.06)]";

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  OPEN: { label: "Open", className: "bg-[#eaf3ff] text-[#1f5fbf]" },
  IN_PROGRESS: { label: "In Progress", className: "bg-[#fff7e6] text-[#b7791f]" },
  PENDING: { label: "Pending", className: "bg-[#f3eefe] text-[#6b46c1]" },
  CLOSED: { label: "Closed", className: "bg-[#eef1f4] text-[#6b7280]" },
};

export const isQuietSupportError = (error: unknown) =>
  isAbortError(error) || (isApiError(error) && error.code === "API_SESSION_EXPIRED");

export function formatSupportDate(value: string | null | undefined, withTime = false) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(
    "en-GB",
    withTime
      ? { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }
      : { day: "numeric", month: "short", year: "numeric" },
  ).format(date);
}

const formatTime = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(date);
};

// Local calendar day of a message, "" when it has no usable date.
function dayKey(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function dayLabel(value: string, t: (source: string) => string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const key = dayKey(value);
  const now = new Date();
  if (key === dayKey(now.toISOString())) return t("Today");
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  if (key === dayKey(yesterday.toISOString())) return t("Yesterday");
  return formatSupportDate(value);
}

function initialsOf(name: string | undefined) {
  const letters = (name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
  return letters || "ME";
}

export function SupportStatusBadge({ status, t }: { status: string; t: (source: string) => string }) {
  const style = STATUS_STYLES[status.toUpperCase()];
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 font-manrope text-[11px] font-semibold leading-none ${style?.className ?? "bg-[#eef1f4] text-[#6b7280]"}`}
    >
      {style ? t(style.label) : status}
    </span>
  );
}

function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5">
      <path d="M13 8H3m4-4L3 8l4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChatIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={className}>
      <path
        d="M4 4.5h12a1.5 1.5 0 0 1 1.5 1.5v6.5A1.5 1.5 0 0 1 16 14H9.5L6 17v-3H4a1.5 1.5 0 0 1-1.5-1.5V6A1.5 1.5 0 0 1 4 4.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 shrink-0">
      <rect x="4.5" y="9" width="11" height="7.5" rx="1.8" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 9V6.8a3 3 0 0 1 6 0V9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-[18px] w-[18px]">
      <path d="M17 3 8.5 11.5M17 3l-5.5 14-3-5.5L3 8.5 17 3Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Avatar({ label, support }: { label: string; support: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-manrope text-[11px] font-bold ${
        support ? "bg-navy text-white shadow-[0_4px_10px_rgba(8,42,104,0.25)]" : "bg-[#e6ebf5] text-navy"
      }`}
    >
      {label}
    </span>
  );
}

function MessageRow({
  message,
  startsGroup,
  userInitials,
  t,
}: {
  message: SupportMessage;
  /** First message of a run from the same sender: shows the avatar and name. */
  startsGroup: boolean;
  userInitials: string;
  t: (source: string) => string;
}) {
  const support = message.fromSupport;
  const time = formatTime(message.createdAt);
  return (
    <div className={`flex items-start gap-2.5 ${startsGroup ? "mt-5" : "mt-1.5"} ${support ? "" : "flex-row-reverse"}`}>
      {startsGroup ? (
        <span className="mt-[18px] flex shrink-0">
          <Avatar label={support ? "TS" : userInitials} support={support} />
        </span>
      ) : (
        <span className="w-9 shrink-0" />
      )}
      <div className={`flex min-w-0 max-w-[82%] flex-col sm:max-w-[70%] ${support ? "items-start" : "items-end"}`}>
        {startsGroup ? (
          <span className="mb-1.5 px-1 font-manrope text-[12px] font-semibold leading-none text-[#4b5563]">
            {support ? t("Tajlandia Support") : t("You")}
          </span>
        ) : null}
        <p
          className={`whitespace-pre-line break-words px-4 py-3 font-manrope text-[14.5px] leading-[22px] ${
            support
              ? `border border-[#e8edf5] bg-white text-[#1a1a1a] shadow-[0_2px_8px_rgba(11,31,77,0.05)] ${startsGroup ? "rounded-[18px] rounded-tl-[6px]" : "rounded-[18px]"}`
              : `bg-linear-to-br from-[#0d3277] to-[#082a68] text-white shadow-[0_6px_16px_rgba(8,42,104,0.22)] ${startsGroup ? "rounded-[18px] rounded-tr-[6px]" : "rounded-[18px]"}`
          }`}
        >
          {message.text}
        </p>
        {time ? <span className="mt-1 px-1 font-manrope text-[10.5px] leading-none text-[#9aa3ad]">{time}</span> : null}
      </div>
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="font-manrope text-[12px] leading-4 text-[#8b939e]">{label}</dt>
      <dd className="mt-1 font-manrope text-[14px] font-semibold leading-5 text-navy">{children}</dd>
    </div>
  );
}

type DetailState =
  | { status: "loading" }
  | { status: "ready"; data: SupportTicketDetailData }
  | { status: "error" };

type SupportTicketDetailProps = {
  ticketId: string;
  /** The row that was opened, shown while the conversation loads. */
  summary: SupportTicket | null;
  onBack: () => void;
  /** Called with the new status/activity after a reply or close, so the list stays in step. */
  onChanged: (ticket: SupportTicket) => void;
  t: (source: string) => string;
};

/** One ticket: header, a chat panel that scrolls on its own, and the reply box. Mount it with `key={ticketId}`. */
export function SupportTicketDetail({ ticketId, summary, onBack, onChanged, t }: SupportTicketDetailProps) {
  const { user } = useAuth();
  const userInitials = initialsOf(user?.name);
  const [detail, setDetail] = useState<DetailState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);
  const [reply, setReply] = useState("");
  const [replyError, setReplyError] = useState("");
  const [sending, setSending] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [closing, setClosing] = useState(false);
  const [closeError, setCloseError] = useState("");
  const threadRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    getSupportTicket(ticketId, controller.signal)
      .then((data) => setDetail({ status: "ready", data }))
      .catch((error: unknown) => {
        if (isQuietSupportError(error)) return;
        logError(error, "Failed to load support ticket");
        setDetail({ status: "error" });
      });
    return () => controller.abort();
  }, [ticketId, reloadKey]);

  // The newest message is at the bottom of the thread, so it opens (and grows) there.
  const messageCount = detail.status === "ready" ? detail.data.messages.length : 0;
  useEffect(() => {
    const thread = threadRef.current;
    if (thread) thread.scrollTop = thread.scrollHeight;
  }, [messageCount]);

  const ticket = detail.status === "ready" ? detail.data.ticket : summary;
  const isClosed = ticket?.status.toUpperCase() === "CLOSED";
  const messages = detail.status === "ready" ? detail.data.messages : [];

  function growInput() {
    const input = inputRef.current;
    if (!input) return;
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 128)}px`;
  }

  async function sendReply(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (sending || detail.status !== "ready") return;
    const message = reply.trim();
    if (!message) return;
    if (message.length > SUPPORT_MESSAGE_MAX_LENGTH) {
      setReplyError("Your message must be 2000 characters or fewer.");
      return;
    }

    setReplyError("");
    setSending(true);
    try {
      await replyToSupportTicket(ticketId, message);
      const now = new Date().toISOString();
      const updated = { ...detail.data.ticket, status: "IN_PROGRESS", lastMessageAt: now };
      setDetail({
        status: "ready",
        data: {
          ticket: updated,
          messages: [...detail.data.messages, { id: `local-${now}`, text: message, createdAt: now, fromSupport: false }],
        },
      });
      setReply("");
      if (inputRef.current) inputRef.current.style.height = "";
      onChanged(updated);
      // Quietly pick up the server's copy of the thread; the local one stays if this fails.
      getSupportTicket(ticketId)
        .then((data) => setDetail({ status: "ready", data }))
        .catch(() => undefined);
    } catch (error) {
      if (isQuietSupportError(error)) return;
      logError(error, "Failed to reply to support ticket");
      setReplyError("We couldn't send your reply. Please try again.");
    } finally {
      setSending(false);
    }
  }

  // Enter sends where there is a physical keyboard; on touch screens it stays a new line.
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    event.preventDefault();
    void sendReply();
  }

  async function closeTicket() {
    if (closing || detail.status !== "ready") return;
    setCloseError("");
    setClosing(true);
    try {
      await closeSupportTicket(ticketId);
      const updated = { ...detail.data.ticket, status: "CLOSED" };
      setDetail({ status: "ready", data: { ...detail.data, ticket: updated } });
      setConfirmClose(false);
      onChanged(updated);
    } catch (error) {
      if (isQuietSupportError(error)) return;
      logError(error, "Failed to close support ticket");
      setCloseError("We couldn't close this ticket. Please try again.");
    } finally {
      setClosing(false);
    }
  }

  const created = ticket ? formatSupportDate(ticket.createdAt, true) : "";
  const lastActivity = ticket ? formatSupportDate(ticket.lastMessageAt ?? ticket.createdAt, true) : "";

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="group inline-flex h-9 cursor-pointer items-center gap-2 rounded-full bg-white pl-1.5 pr-4 font-manrope text-[13px] font-medium text-navy shadow-[0_2px_10px_rgba(11,31,77,0.08)] transition-colors hover:bg-navy hover:text-white"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f1f4f9] text-navy transition-colors group-hover:bg-white/15 group-hover:text-white">
          <ArrowLeftIcon />
        </span>
        {t("All tickets")}
      </button>

      {ticket ? (
        <div className={`${card} mt-4 px-5 py-5 sm:px-6`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h2 className="break-words font-manrope text-[20px] font-semibold leading-7 tracking-[-0.02em] text-navy sm:text-[22px]">
                {ticket.subject}
              </h2>
              <p className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 font-manrope text-[12px] leading-4 text-[#8b939e]">
                <span className="rounded-full bg-[#edf3ff] px-2.5 py-1 text-[11px] font-semibold leading-none tracking-[0.03em] text-navy">
                  {ticket.ticketNo}
                </span>
                {ticket.category ? (
                  <span className="rounded-full bg-[#f4f6f9] px-2.5 py-1 text-[11px] font-medium leading-none text-[#66717c]">
                    {t(ticket.category)}
                  </span>
                ) : null}
                {created ? <span>{created}</span> : null}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <SupportStatusBadge status={ticket.status} t={t} />
              {isClosed || detail.status !== "ready" || confirmClose ? null : (
                <button
                  type="button"
                  onClick={() => {
                    setCloseError("");
                    setConfirmClose(true);
                  }}
                  className="inline-flex h-9 cursor-pointer items-center justify-center rounded-full border border-[#f3c3c8] bg-white px-4 font-manrope text-[13px] font-medium leading-none text-[#d52b35] transition hover:bg-[#fff1f2]"
                >
                  {t("Close Ticket")}
                </button>
              )}
            </div>
          </div>

          {confirmClose && !isClosed ? (
            <div
              role="alertdialog"
              aria-label={t("Close this ticket?")}
              className="mt-4 flex flex-col gap-3 rounded-[14px] bg-[#fff6f6] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <p className="font-manrope text-[12px] leading-4 text-[#66717c]">
                <span className="block text-[13px] font-semibold text-navy">{t("Close this ticket?")}</span>
                {t("You won't be able to reply after it is closed.")}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeTicket}
                  disabled={closing}
                  aria-busy={closing}
                  className="inline-flex h-9 cursor-pointer items-center justify-center rounded-full bg-[#e11d2e] px-4 font-manrope text-[12px] font-medium text-white transition hover:bg-[#c4182a] disabled:cursor-wait disabled:opacity-70"
                >
                  {closing ? t("Closing...") : t("Yes, close it")}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClose(false)}
                  disabled={closing}
                  className="inline-flex h-9 cursor-pointer items-center justify-center rounded-full border border-[#e4e9ef] bg-white px-4 font-manrope text-[12px] font-medium text-[#3d4650] transition hover:bg-[#f7f9fc]"
                >
                  {t("Keep open")}
                </button>
              </div>
            </div>
          ) : null}
          {closeError ? (
            <p role="alert" className="font-manrope mt-3 text-[12px] leading-4 text-[#d52b35]">
              {t(closeError)}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
        {detail.status === "loading" ? (
          <div aria-busy="true" className={`${card} h-[clamp(420px,calc(100svh-340px),640px)] overflow-hidden p-6`}>
            <span className="sr-only" role="status">
              {t("Loading ticket...")}
            </span>
            {[0, 1, 2].map((key) => (
              <span
                key={key}
                aria-hidden="true"
                className={`mb-4 block h-[64px] w-3/5 animate-pulse rounded-[18px] bg-[#f1f4f9] motion-reduce:animate-none ${key === 1 ? "ml-auto" : ""}`}
              />
            ))}
          </div>
        ) : detail.status === "error" ? (
          <div role="alert" className={`${card} flex flex-col gap-3 px-5 py-5 sm:flex-row sm:items-center sm:justify-between`}>
            <div>
              <p className="font-manrope text-[14px] font-semibold text-[#1a1a1a]">{t("We couldn't load this ticket.")}</p>
              <p className="mt-0.5 font-manrope text-[13px] text-[#8b939e]">{t("Please check your connection and try again.")}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setDetail({ status: "loading" });
                setReloadKey((key) => key + 1);
              }}
              className="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center rounded-[10px] bg-navy px-4 font-manrope text-[13px] font-medium text-white"
            >
              {t("Try again")}
            </button>
          </div>
        ) : (
          // The panel has a fixed height: only the thread scrolls, the header and reply box stay put.
          <section
            aria-label={t("Conversation")}
            className={`${card} flex h-[clamp(420px,calc(100svh-340px),640px)] min-w-0 flex-col overflow-hidden`}
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#eef2f7] px-5 py-3.5 sm:px-6">
              <h3 className="flex items-center gap-2 font-manrope text-[12px] font-semibold uppercase tracking-[0.1em] text-[#66717c]">
                <ChatIcon />
                {t("Conversation")}
              </h3>
              <span className="font-manrope text-[12px] text-[#8b939e]">
                {messages.length} {t(messages.length === 1 ? "message" : "messages")}
              </span>
            </div>

            <div ref={threadRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#f8fafd] px-4 pb-5 pt-1 [scrollbar-color:#c9d3e3_transparent] [scrollbar-width:thin] sm:px-6">
              {messages.length ? (
                messages.map((message, index) => {
                  const previous = messages[index - 1];
                  const newDay = !previous || dayKey(previous.createdAt) !== dayKey(message.createdAt);
                  const startsGroup = newDay || previous.fromSupport !== message.fromSupport;
                  return (
                    <Fragment key={message.id}>
                      {newDay && message.createdAt ? (
                        <div className="mt-5 flex items-center gap-3" role="separator">
                          <span className="h-px flex-1 bg-[#e3e9f2]" />
                          <span className="font-manrope text-[11px] font-semibold uppercase tracking-[0.1em] text-[#8b939e]">
                            {dayLabel(message.createdAt, t)}
                          </span>
                          <span className="h-px flex-1 bg-[#e3e9f2]" />
                        </div>
                      ) : null}
                      <MessageRow message={message} startsGroup={startsGroup} userInitials={userInitials} t={t} />
                    </Fragment>
                  );
                })
              ) : (
                <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-3 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#edf3ff] text-navy">
                    <ChatIcon className="h-6 w-6" />
                  </span>
                  <p className="font-manrope text-[13px] text-[#8b939e]">{t("No messages yet.")}</p>
                </div>
              )}
            </div>

            {isClosed ? (
              <div className="flex shrink-0 items-center gap-3 border-t border-[#eef2f7] bg-white px-5 py-4 font-manrope text-[13px] leading-5 text-[#66717c] sm:px-6">
                <LockIcon />
                <p>
                  <strong className="font-semibold text-navy">{t("This ticket is closed.")}</strong>{" "}
                  {t("It can no longer be replied to.")}
                </p>
              </div>
            ) : (
              <form onSubmit={sendReply} noValidate className="shrink-0 border-t border-[#eef2f7] bg-white px-4 py-3 sm:px-6">
                <div
                  className={`flex items-end gap-2 rounded-[22px] border bg-[#f8fafd] py-1.5 pl-4 pr-1.5 transition-colors focus-within:border-navy focus-within:bg-white ${replyError ? "border-[#f3c3c8]" : "border-[#e4e9ef]"}`}
                >
                  <label htmlFor="support-reply" className="sr-only">
                    {t("Reply")}
                  </label>
                  <textarea
                    id="support-reply"
                    ref={inputRef}
                    rows={1}
                    value={reply}
                    onChange={(event) => {
                      setReply(event.target.value);
                      setReplyError("");
                      growInput();
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={t("Write your reply...")}
                    maxLength={SUPPORT_MESSAGE_MAX_LENGTH}
                    aria-invalid={Boolean(replyError)}
                    aria-describedby={replyError ? "support-reply-error" : undefined}
                    className="font-manrope max-h-32 min-h-[28px] w-full flex-1 resize-none self-center bg-transparent py-1 text-[14px] leading-[22px] text-[#1a1a1a] outline-none placeholder:text-[#9aa3ad]"
                  />
                  <button
                    type="submit"
                    disabled={sending || !reply.trim()}
                    aria-busy={sending}
                    aria-label={t("Send Reply")}
                    className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-navy text-white shadow-[0_6px_14px_rgba(8,42,104,0.28)] transition hover:bg-navy-deep disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                  >
                    {sending ? (
                      <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none" />
                    ) : (
                      <SendIcon />
                    )}
                  </button>
                </div>
                <div className="mt-1.5 flex items-center justify-between gap-3 px-2">
                  <p id="support-reply-error" className="font-manrope text-[12px] leading-4 text-[#d52b35]">
                    {replyError ? t(replyError) : ""}
                  </p>
                  {reply.length > SUPPORT_MESSAGE_MAX_LENGTH * 0.8 ? (
                    <p className="font-manrope shrink-0 text-[11px] text-[#9aa3ad]">
                      {reply.length}/{SUPPORT_MESSAGE_MAX_LENGTH}
                    </p>
                  ) : null}
                </div>
              </form>
            )}
          </section>
        )}

        {ticket ? (
          <aside aria-label={t("Ticket Details")} className={`${card} hidden px-5 py-5 lg:block`}>
            <h3 className="font-manrope text-[12px] font-semibold uppercase tracking-[0.1em] text-[#66717c]">{t("Ticket Details")}</h3>
            <dl className="mt-5 grid gap-5">
              <DetailRow label={t("Ticket")}>{ticket.ticketNo}</DetailRow>
              {ticket.category ? <DetailRow label={t("Category")}>{t(ticket.category)}</DetailRow> : null}
              <DetailRow label={t("Status")}>
                <SupportStatusBadge status={ticket.status} t={t} />
              </DetailRow>
              {created ? <DetailRow label={t("Created")}>{created}</DetailRow> : null}
              {lastActivity ? <DetailRow label={t("Last activity")}>{lastActivity}</DetailRow> : null}
              {isClosed && lastActivity ? <DetailRow label={t("Closed")}>{lastActivity}</DetailRow> : null}
            </dl>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
