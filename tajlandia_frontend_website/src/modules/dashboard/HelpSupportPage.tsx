"use client";

import Image from "next/image";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { routes } from "@/lib/constants/routes";
import { useAuth } from "@/lib/hooks/useAuth";
import { logError } from "@/lib/logging/logger";
import { useDashboardLanguage } from "./DashboardLanguageContext";
import { PageLoader } from "@/components/ui/PageLoader";
import {
  SUPPORT_CATEGORY_MAX_LENGTH,
  SUPPORT_MESSAGE_MAX_LENGTH,
  SUPPORT_STATUSES,
  SUPPORT_SUBJECT_MAX_LENGTH,
  type SupportTicket,
} from "./schemas/help-support.schema";
import { createSupportTicket, getSupportTickets } from "./services/help-support.client";
import {
  formatSupportDate,
  isQuietSupportError,
  SupportStatusBadge,
  SupportTicketDetail,
} from "./SupportTicketDetail";

type TicketsState =
  | { status: "loading" }
  | { status: "ready"; tickets: SupportTicket[] }
  | { status: "error" };

type StatusFilter = "ALL" | (typeof SUPPORT_STATUSES)[number];

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "OPEN", label: "Open" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "PENDING", label: "Pending" },
  { key: "CLOSED", label: "Closed" },
];

// Sent as `category` (English, whatever the page language); the first one is the default.
const CATEGORIES = ["General", "Certificate", "Payment", "Account", "Plot & Land", "Technical Issue", "Other"];

const card = "rounded-[16px] bg-white shadow-[0_8px_28px_rgba(11,31,77,0.06)]";
const fieldBase =
  "font-manrope w-full rounded-[12px] border bg-white px-4 text-[14px] leading-5 text-[#1a1a1a] outline-none placeholder:text-[#b0b7be]";

function ChevronIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={`h-4 w-4 shrink-0 text-[#66717c] ${className}`}>
      <path d="M4 6.2 8 10.2 12 6.2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function HelpSupportPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useDashboardLanguage();
  // `GET /help-support`: the user's tickets, most recent activity first.
  const [tickets, setTickets] = useState<TicketsState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0] ?? "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace(routes.login);
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const controller = new AbortController();
    getSupportTickets(controller.signal)
      .then((items) => setTickets({ status: "ready", tickets: items }))
      .catch((loadError: unknown) => {
        if (isQuietSupportError(loadError)) return;
        logError(loadError, "Failed to load support tickets");
        setTickets({ status: "error" });
      });
    return () => controller.abort();
  }, [isAuthenticated, reloadKey]);

  if (isLoading || !isAuthenticated) {
    return <PageLoader label={t("Loading support...")} />;
  }

  const allTickets = tickets.status === "ready" ? tickets.tickets : [];
  const needle = search.trim().toLowerCase();
  const visibleTickets = allTickets.filter(
    (ticket) =>
      (filter === "ALL" || ticket.status.toUpperCase() === filter) &&
      (!needle || ticket.subject.toLowerCase().includes(needle) || ticket.ticketNo.toLowerCase().includes(needle)),
  );
  const countOf = (key: StatusFilter) =>
    key === "ALL" ? allTickets.length : allTickets.filter((ticket) => ticket.status.toUpperCase() === key).length;
  const selectedTicket = allTickets.find((ticket) => ticket._id === selectedId) ?? null;

  function resetForm() {
    setSubject("");
    setCategory(CATEGORIES[0] ?? "");
    setMessage("");
    setError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    const subjectText = subject.trim();
    const messageText = message.trim();
    setSent(false);
    if (!subjectText) {
      setError("Please enter a subject.");
      return;
    }
    if (subjectText.length > SUPPORT_SUBJECT_MAX_LENGTH) {
      setError("Your subject must be 150 characters or fewer.");
      return;
    }
    if (!messageText) {
      setError("Please enter a message.");
      return;
    }
    if (messageText.length > SUPPORT_MESSAGE_MAX_LENGTH) {
      setError("Your message must be 2000 characters or fewer.");
      return;
    }

    setError("");
    setSending(true);
    try {
      const ticket = await createSupportTicket({
        subject: subjectText,
        category: category.slice(0, SUPPORT_CATEGORY_MAX_LENGTH) || undefined,
        message: messageText,
      });
      setTickets((current) => ({
        status: "ready",
        tickets: [ticket, ...(current.status === "ready" ? current.tickets.filter((item) => item._id !== ticket._id) : [])],
      }));
      resetForm();
      setShowForm(false);
      setSent(true);
      setFilter("ALL");
      setSearch("");
    } catch (sendError) {
      if (isQuietSupportError(sendError)) return;
      logError(sendError, "Failed to create support ticket");
      setError("We couldn't create your ticket. Please try again.");
    } finally {
      setSending(false);
    }
  }

  function updateTicket(updated: SupportTicket) {
    // A reply or close moves the ticket to the top, like the API's "recent activity" order.
    setTickets((current) =>
      current.status === "ready"
        ? { status: "ready", tickets: [updated, ...current.tickets.filter((item) => item._id !== updated._id)] }
        : current,
    );
  }

  return (
    <div className="min-h-[100svh] bg-[#f7f9fc] text-navy">
      <main className="w-full px-5 pb-14 pt-6 sm:px-8 lg:p-0 lg:[&>section]:mx-auto lg:[&>section]:w-full lg:[&>section]:max-w-[1120px] lg:[&>section]:px-10 lg:[&>section]:py-8">
        <section className="min-w-0">
          {selectedId ? (
            <SupportTicketDetail
              key={selectedId}
              ticketId={selectedId}
              summary={selectedTicket}
              onBack={() => setSelectedId(null)}
              onChanged={updateTicket}
              t={t}
            />
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <h1 className="font-manrope text-[28px] font-semibold leading-none tracking-[-0.03em] text-navy sm:text-[32px]">
                    {t("Help & Support")}
                  </h1>
                  <p className="font-manrope mt-2 text-[14px] leading-5 text-[#8b939e]">{t("Need help? We're here for you.")}</p>
                </div>
                <button
                  type="button"
                  aria-expanded={showForm}
                  onClick={() => {
                    setShowForm((open) => !open);
                    setSent(false);
                  }}
                  className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full bg-navy px-5 font-manrope text-[14px] font-medium leading-none text-white transition hover:bg-navy-deep"
                >
                  <svg viewBox="0 0 16 16" aria-hidden="true" className={`h-3.5 w-3.5 transition-transform ${showForm ? "rotate-45" : ""}`}>
                    <path d="M8 3v10M3 8h10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                  {t("New Ticket")}
                </button>
              </div>

              {sent ? (
                <p role="status" className="font-manrope mt-4 rounded-[12px] bg-[#eefaf3] px-4 py-3 text-[13px] leading-5 text-[#168a56]">
                  {t("Your ticket has been created. We'll reply here soon.")}
                </p>
              ) : null}

              {showForm ? (
                <form onSubmit={submit} noValidate className={`${card} mt-5 px-5 py-5 sm:px-6`}>
                  <h2 className="font-manrope text-[16px] font-semibold leading-5 text-navy">{t("Create a new ticket")}</h2>

                  <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_220px]">
                    <div>
                      <label htmlFor="support-subject" className="font-manrope text-[13px] font-semibold leading-5 text-navy">
                        {t("Subject")}
                      </label>
                      <input
                        id="support-subject"
                        value={subject}
                        onChange={(event) => {
                          setSubject(event.target.value);
                          setError("");
                        }}
                        placeholder={t("Short summary of your issue")}
                        maxLength={SUPPORT_SUBJECT_MAX_LENGTH}
                        className={`${fieldBase} mt-2 h-11 ${error && !subject.trim() ? "border-[#f3c3c8] bg-[#fff1f2]" : "border-[#e4e9ef] focus:border-navy"}`}
                      />
                    </div>
                    <div>
                      <label htmlFor="support-category" className="font-manrope text-[13px] font-semibold leading-5 text-navy">
                        {t("Category")}
                      </label>
                      <div className="relative mt-2">
                        <select
                          id="support-category"
                          value={category}
                          onChange={(event) => setCategory(event.target.value)}
                          className={`${fieldBase} h-11 cursor-pointer appearance-none border-[#e4e9ef] pr-10 focus:border-navy`}
                        >
                          {CATEGORIES.map((option) => (
                            <option key={option} value={option}>
                              {t(option)}
                            </option>
                          ))}
                        </select>
                        <ChevronIcon className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                  </div>

                  <label htmlFor="support-message" className="font-manrope mt-4 block text-[13px] font-semibold leading-5 text-navy">
                    {t("Message")}
                  </label>
                  <textarea
                    id="support-message"
                    value={message}
                    onChange={(event) => {
                      setMessage(event.target.value);
                      setError("");
                    }}
                    placeholder={t("Describe your issue in detail...")}
                    maxLength={SUPPORT_MESSAGE_MAX_LENGTH}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? "support-form-error" : undefined}
                    className={`${fieldBase} mt-2 h-[120px] resize-none py-3 ${error && !message.trim() ? "border-[#f3c3c8] bg-[#fff1f2]" : "border-[#e4e9ef] focus:border-navy"}`}
                  />
                  <p className="font-manrope mt-1 text-right text-[11px] text-[#b0b7be]">
                    {message.length}/{SUPPORT_MESSAGE_MAX_LENGTH}
                  </p>
                  {error ? (
                    <p id="support-form-error" role="alert" className="font-manrope mt-1.5 text-[12px] leading-4 text-[#d52b35]">
                      {t(error)}
                    </p>
                  ) : null}

                  <div className="mt-5 flex flex-col gap-4 border-t border-[#e4e9ef] pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-manrope flex items-center gap-2 text-[12px] leading-4 text-[#8b939e]">
                      <Image src="/images/profile/ic_privacy.svg" alt="" width={14} height={14} className="h-3.5 w-3.5 shrink-0" />
                      <span>{t("All changes verified under 256-bit Cadastral Escrow protocol.")}</span>
                    </p>
                    <div className="flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          resetForm();
                          setShowForm(false);
                        }}
                        className="inline-flex h-11 cursor-pointer items-center justify-center rounded-[12px] border border-[#e4e9ef] bg-white px-5 font-manrope text-[14px] font-medium leading-none text-[#3d4650] transition hover:bg-[#f7f9fc]"
                      >
                        {t("Cancel")}
                      </button>
                      <button
                        type="submit"
                        disabled={sending}
                        aria-busy={sending}
                        className="inline-flex h-11 cursor-pointer items-center justify-center rounded-[12px] bg-navy px-5 font-manrope text-[14px] font-medium leading-none text-white transition hover:bg-navy-deep disabled:cursor-wait disabled:opacity-70"
                      >
                        {sending ? t("Sending...") : t("Submit Ticket")}
                      </button>
                    </div>
                  </div>
                </form>
              ) : null}

              {tickets.status === "ready" && allTickets.length ? (
                <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div
                    role="group"
                    aria-label={t("Status")}
                    className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0"
                  >
                    {STATUS_FILTERS.map((option) => (
                      <button
                        key={option.key}
                        type="button"
                        aria-pressed={filter === option.key}
                        onClick={() => setFilter(option.key)}
                        className={`inline-flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-full border px-4 font-manrope text-[13px] font-medium leading-none transition-colors ${
                          filter === option.key
                            ? "border-navy bg-navy text-white"
                            : "border-[#e4e9ef] bg-white text-[#3d4650] hover:bg-[#f1f4f9]"
                        }`}
                      >
                        {t(option.label)}
                        <span className={`text-[11px] ${filter === option.key ? "text-white/70" : "text-[#8b939e]"}`}>
                          {countOf(option.key)}
                        </span>
                      </button>
                    ))}
                  </div>
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    aria-label={t("Search by ticket no. or subject")}
                    placeholder={t("Search by ticket no. or subject")}
                    className={`${fieldBase} h-10 border-[#e4e9ef] focus:border-navy lg:max-w-[300px]`}
                  />
                </div>
              ) : null}

              {tickets.status === "loading" ? (
                <div aria-busy="true" className="mt-5 grid gap-2.5">
                  <span className="sr-only" role="status">
                    {t("Loading support...")}
                  </span>
                  {[0, 1, 2].map((key) => (
                    <span key={key} aria-hidden="true" className="block h-[76px] animate-pulse rounded-[14px] bg-white motion-reduce:animate-none" />
                  ))}
                </div>
              ) : tickets.status === "error" ? (
                <div role="alert" className={`${card} mt-5 flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between`}>
                  <div>
                    <p className="font-manrope text-[14px] font-semibold text-[#1a1a1a]">{t("We couldn't load your tickets.")}</p>
                    <p className="font-manrope mt-0.5 text-[13px] text-[#8b939e]">{t("Please check your connection and try again.")}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setTickets({ status: "loading" });
                      setReloadKey((key) => key + 1);
                    }}
                    className="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center rounded-[10px] bg-navy px-4 font-manrope text-[13px] font-medium text-white"
                  >
                    {t("Try again")}
                  </button>
                </div>
              ) : visibleTickets.length ? (
                <ul className="mt-4 grid gap-2.5">
                  {visibleTickets.map((ticket) => {
                    const activity = formatSupportDate(ticket.lastMessageAt ?? ticket.createdAt);
                    return (
                      <li key={ticket._id}>
                        <button
                          type="button"
                          onClick={() => setSelectedId(ticket._id)}
                          className={`${card} group flex w-full cursor-pointer items-center justify-between gap-4 px-4 py-4 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-18px_rgba(11,31,77,0.3)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:px-5`}
                        >
                          <span className="min-w-0">
                            <span className="line-clamp-2 break-words font-manrope text-[15px] font-semibold leading-5 text-navy">
                              {ticket.subject}
                            </span>
                            <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 font-manrope text-[12px] leading-4 text-[#8b939e]">
                              <span className="font-medium text-[#66717c]">{ticket.ticketNo}</span>
                              {ticket.category ? (
                                <>
                                  <span aria-hidden="true">•</span>
                                  <span>{t(ticket.category)}</span>
                                </>
                              ) : null}
                              {activity ? (
                                <>
                                  <span aria-hidden="true">•</span>
                                  <span>
                                    {t("Last activity")} {activity}
                                  </span>
                                </>
                              ) : null}
                            </span>
                          </span>
                          <span className="flex shrink-0 items-center gap-3">
                            <SupportStatusBadge status={ticket.status} t={t} />
                            <ChevronIcon className="-rotate-90 transition-transform group-hover:translate-x-0.5" />
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className={`${card} mt-5 px-4 py-8 text-center`}>
                  <p className="font-manrope text-[14px] font-semibold text-[#1a1a1a]">
                    {allTickets.length ? t("No tickets match your search.") : t("You haven't created any tickets yet.")}
                  </p>
                  {allTickets.length ? null : (
                    <p className="font-manrope mt-1 text-[13px] text-[#8b939e]">{t("Create a ticket and our team will reply here.")}</p>
                  )}
                </div>
              )}

              <div className={`${card} mt-6 flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6`}>
                <div className="min-w-0">
                  <h2 className="font-manrope flex flex-wrap items-center gap-2 text-[16px] font-semibold leading-5 text-[#1a1a1a]">
                    <span>{t("Still need help?")}</span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#edf3ff] px-2.5 py-1 font-manrope text-[11px] font-medium leading-none text-navy">
                      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-navy" />
                      {t("Within 24 hours")}
                    </span>
                  </h2>
                  <p className="font-manrope mt-2 max-w-[460px] text-[13px] leading-5 text-[#8b939e]">
                    {t("Our cadastral survey and registry team is standing by to resolve custom requests.")}
                  </p>
                </div>
                <a href="mailto:support@tajlandia.com" className="flex shrink-0 items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#edf3ff] text-navy">
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
                      <rect x="3.5" y="5.5" width="17" height="13" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
                      <path d="m4.5 7 7.5 6 7.5-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span>
                    <span className="block font-manrope text-[11px] font-medium uppercase tracking-[0.08em] text-[#8b939e]">
                      {t("Direct mail")}
                    </span>
                    <span className="mt-0.5 block font-manrope text-[14px] font-medium leading-5 text-[#1a1a1a]">support@tajlandia.com</span>
                  </span>
                </a>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
