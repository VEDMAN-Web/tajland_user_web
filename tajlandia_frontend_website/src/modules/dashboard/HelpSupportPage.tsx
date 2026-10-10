"use client";

import Image from "next/image";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { isAbortError } from "@/lib/api/browser-client";
import { isApiError } from "@/lib/api/errors";
import { routes } from "@/lib/constants/routes";
import { useAuth } from "@/lib/hooks/useAuth";
import { logError } from "@/lib/logging/logger";
import { AccountMenu } from "./AccountMenu";
import { DashboardNavbar } from "./DashboardNavbar";
import { useDashboardLanguage } from "./DashboardLanguageContext";
import { PageLoader } from "@/components/ui/PageLoader";
import { SUPPORT_QUERY_MAX_LENGTH, type SupportTicket } from "./schemas/help-support.schema";
import { createSupportTicket, getSupportTickets } from "./services/help-support.client";

type TicketsState =
  | { status: "loading" }
  | { status: "ready"; tickets: SupportTicket[] }
  | { status: "error" };

const isQuietError = (error: unknown) =>
  isAbortError(error) || (isApiError(error) && error.code === "API_SESSION_EXPIRED");

function formatAsked(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={`h-4 w-4 shrink-0 text-[#66717c] transition-transform ${open ? "rotate-180" : ""}`}>
      <path d="M4 6.2 8 10.2 12 6.2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function HelpSupportPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useDashboardLanguage();
  // `GET /help-support`: the user's questions and the team's answers.
  const [tickets, setTickets] = useState<TicketsState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);
  const [openTicket, setOpenTicket] = useState<string | null>(null);
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
      .then((items) => {
        setTickets({ status: "ready", tickets: items });
        // The newest question starts open, like the first FAQ did.
        setOpenTicket((current) => current ?? items[0]?._id ?? null);
      })
      .catch((loadError: unknown) => {
        if (isQuietError(loadError)) return;
        logError(loadError, "Failed to load support tickets");
        setTickets({ status: "error" });
      });
    return () => controller.abort();
  }, [isAuthenticated, reloadKey]);

  if (isLoading || !isAuthenticated) {
    return <PageLoader label={t("Loading support...")} />;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    const query = message.trim();
    if (!query) {
      setSent(false);
      setError("Please enter your question.");
      return;
    }
    if (query.length > SUPPORT_QUERY_MAX_LENGTH) {
      setSent(false);
      setError("Your question must be 1000 characters or fewer.");
      return;
    }

    setError("");
    setSending(true);
    try {
      const ticket = await createSupportTicket(query);
      setTickets((current) => ({
        status: "ready",
        tickets: [ticket, ...(current.status === "ready" ? current.tickets.filter((item) => item._id !== ticket._id) : [])],
      }));
      setOpenTicket(ticket._id);
      setMessage("");
      setSent(true);
    } catch (sendError) {
      if (isQuietError(sendError)) return;
      logError(sendError, "Failed to send support ticket");
      setError("We couldn't send your question. Please try again.");
    } finally {
      setSending(false);
    }
  }

  function cancel() {
    setMessage("");
    setError("");
    setSent(false);
  }

  return (
    <div className="min-h-[100svh] bg-[#f7f9fc] text-navy">
      <DashboardNavbar active="home" />
      <main className="mx-auto grid w-full max-w-[1180px] gap-6 px-5 pb-14 pt-8 sm:px-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start lg:gap-7">
        <AccountMenu active="help" />

        <section className="min-w-0">
          <h1 className="font-manrope text-[28px] font-semibold leading-none tracking-[-0.03em] text-navy sm:text-[32px]">
            {t("Help & Support")}
          </h1>
          <p className="font-manrope mt-2 text-[14px] leading-5 text-[#8b939e]">
            {t("Need help? We're here for you.")}
          </p>

          {tickets.status === "loading" ? (
            <div aria-busy="true" className="mt-5 grid gap-2.5">
              <span className="sr-only" role="status">
                {t("Loading support...")}
              </span>
              {[0, 1, 2].map((key) => (
                <span
                  key={key}
                  aria-hidden="true"
                  className="block h-[52px] animate-pulse rounded-[12px] bg-white motion-reduce:animate-none"
                />
              ))}
            </div>
          ) : tickets.status === "error" ? (
            <div role="alert" className="mt-5 flex flex-col gap-3 rounded-[12px] bg-white px-4 py-4 shadow-[0_8px_28px_rgba(11,31,77,0.06)] sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-manrope text-[14px] font-semibold text-[#1a1a1a]">{t("We couldn't load your questions.")}</p>
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
          ) : tickets.tickets.length ? (
            <div className="mt-5 grid gap-2.5">
              {tickets.tickets.map((ticket) => {
                const isOpen = openTicket === ticket._id;
                const answer = ticket.answer?.trim();
                const asked = formatAsked(ticket.createdAt);
                return (
                  <div key={ticket._id} className={`overflow-hidden rounded-[12px] bg-white shadow-[0_8px_28px_rgba(11,31,77,0.06)] ${isOpen ? "border-l-[3px] border-l-[#e11d2e]" : ""}`}>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setOpenTicket(isOpen ? null : ticket._id)}
                      className="flex min-h-[52px] w-full cursor-pointer items-center justify-between gap-4 px-4 py-3 text-left"
                    >
                      <span className="min-w-0 break-words font-manrope text-[14px] font-semibold leading-5 text-navy">{ticket.query}</span>
                      <span className="flex shrink-0 items-center gap-2">
                        {answer ? null : (
                          <span className="rounded-full bg-[#fff7e6] px-2 py-0.5 font-manrope text-[11px] font-medium text-[#b7791f]">
                            {t("Awaiting reply")}
                          </span>
                        )}
                        <ChevronIcon open={isOpen} />
                      </span>
                    </button>
                    {isOpen ? (
                      <div className="border-t border-[#eef2f6] px-4 py-3 font-manrope text-[13px] leading-5">
                        <p className="whitespace-pre-line break-words text-[#8b939e]">
                          {answer || t("Our team will answer your question soon. You'll see the reply here.")}
                        </p>
                        {asked ? (
                          <p className="mt-2 text-[11px] text-[#b0b7be]">
                            {t("Asked on")} {asked}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-5 rounded-[12px] bg-white px-4 py-6 text-center font-manrope text-[13px] text-[#8b939e] shadow-[0_8px_28px_rgba(11,31,77,0.06)]">
              {t("You haven't asked anything yet. Send your question below.")}
            </p>
          )}

          <form onSubmit={submit} className="mt-5" noValidate>
            <label htmlFor="support-message" className="font-manrope text-[14px] font-semibold leading-5 text-navy">
              {t("Other")}
            </label>
            <textarea
              id="support-message"
              value={message}
              onChange={(event) => {
                setMessage(event.target.value);
                setError("");
                setSent(false);
              }}
              placeholder={t("Send your Queries...")}
              maxLength={SUPPORT_QUERY_MAX_LENGTH}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "support-message-error" : undefined}
              className={`font-manrope mt-2 h-[88px] w-full resize-none rounded-[12px] border bg-white px-4 py-3 text-[14px] leading-5 text-[#1a1a1a] outline-none placeholder:text-[#b0b7be] ${error ? "border-[#f3c3c8] bg-[#fff1f2]" : "border-[#e4e9ef] focus:border-navy"}`}
            />
            <p className="font-manrope mt-1 text-right text-[11px] text-[#b0b7be]">
              {message.length}/{SUPPORT_QUERY_MAX_LENGTH}
            </p>
            {error ? (
              <p id="support-message-error" className="font-manrope mt-1.5 text-[12px] leading-4 text-[#d52b35]">
                {t(error)}
              </p>
            ) : null}
            {sent ? (
              <p role="status" className="font-manrope mt-1.5 text-[12px] leading-4 text-[#1aae6f]">
                {t("Your question has been sent. We'll reply here soon.")}
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
                  onClick={cancel}
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
                  {sending ? t("Sending...") : t("Send Message →")}
                </button>
              </div>
            </div>
          </form>

          <div className="mt-5 flex flex-col gap-4 rounded-[16px] bg-white px-5 py-5 shadow-[0_8px_28px_rgba(11,31,77,0.06)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
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
                <span className="mt-0.5 block font-manrope text-[14px] font-medium leading-5 text-[#1a1a1a]">
                  support@tajlandia.com
                </span>
              </span>
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
