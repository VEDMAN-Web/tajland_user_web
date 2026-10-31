"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { isAbortError } from "@/lib/api/browser-client";
import { isApiError } from "@/lib/api/errors";
import { logError } from "@/lib/logging/logger";
import { notificationPath } from "@/lib/push/notification-path";
import { PUSH_RECEIVED_EVENT } from "@/lib/push/onesignal";
import { useDashboardLanguage } from "./DashboardLanguageContext";
import type { AppNotification } from "./schemas/notifications.schema";
import {
  clearAllNotifications,
  deleteNotification,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "./services/notifications.client";

const PAGE_SIZE = 20;
// Also reloads on focus, on a push and when the panel opens; this only covers a tab left open.
const REFRESH_MS = 60_000;
const LOCALES = { EN: "en", PL: "pl", TH: "th" } as const;

type ListState =
  | { status: "loading" }
  | { status: "ready"; items: AppNotification[]; unread: number }
  | { status: "error" };

function isQuiet(error: unknown) {
  return isAbortError(error) || (isApiError(error) && error.code === "API_SESSION_EXPIRED");
}

// "5 minutes ago", "yesterday"; older than a week as a date.
function formatAgo(value: string, locale: string) {
  const time = Date.parse(value);
  if (Number.isNaN(time)) return "";
  const seconds = Math.round((time - Date.now()) / 1000);
  const abs = Math.abs(seconds);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (abs < 60) return rtf.format(0, "second");
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), "minute");
  if (abs < 86_400) return rtf.format(Math.round(seconds / 3600), "hour");
  if (abs < 7 * 86_400) return rtf.format(Math.round(seconds / 86_400), "day");
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }).format(time);
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path
        d="M6 9.5a6 6 0 0 1 12 0c0 4.2 1.5 5.6 2 6.5H4c.5-.9 2-2.3 2-6.5ZM10 19a2 2 0 0 0 4 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TypeIcon({ type }: { type: string }) {
  // A ticket reply (speech bubble) or a ready certificate (document); anything else a bell.
  const path =
    type === "HELP_SUPPORT_TICKET"
      ? "M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6a2.5 2.5 0 0 1-2.5 2.5H11l-4 3.5V15h-.5A2.5 2.5 0 0 1 4 12.5Z"
      : type === "CERTIFICATE_READY"
        ? "M7 3.5h8l4 4V20H7zM14.5 3.5V8H19M10 13h6M10 16.5h4"
        : "M6 9.5a6 6 0 0 1 12 0c0 4.2 1.5 5.6 2 6.5H4c.5-.9 2-2.3 2-6.5Z";
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px]">
      <path d={path} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * The bell in the dashboard's top bar: a badge with the unread count and a panel with the
 * latest notifications (`GET /notifications`). A row opens what it is about and marks it read.
 */
export function NotificationBell() {
  const router = useRouter();
  const { t, language } = useDashboardLanguage();
  const [state, setState] = useState<ListState>({ status: "loading" });
  const [open, setOpen] = useState(false);
  // "Clear all" asks once before deleting everything.
  const [confirmClear, setConfirmClear] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const locale = LOCALES[language];

  // `silent`: a background refresh keeps what is shown rather than flashing a loader.
  const load = useCallback((signal?: AbortSignal) => {
    getNotifications({ page: 1, limit: PAGE_SIZE }, signal)
      .then((page) => setState({ status: "ready", items: page.items, unread: page.unreadCount }))
      .catch((error: unknown) => {
        if (isQuiet(error)) return;
        logError(error, "Failed to load notifications");
        setState((current) => (current.status === "ready" ? current : { status: "error" }));
      });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    const refresh = () => load();
    window.addEventListener("focus", refresh);
    window.addEventListener(PUSH_RECEIVED_EVENT, refresh);
    const timer = window.setInterval(refresh, REFRESH_MS);
    return () => {
      controller.abort();
      window.removeEventListener("focus", refresh);
      window.removeEventListener(PUSH_RECEIVED_EVENT, refresh);
      window.clearInterval(timer);
    };
  }, [load]);

  // Open panel: a click outside or Escape closes it.
  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const unread = state.status === "ready" ? state.unread : 0;

  function toggle() {
    if (!open) load();
    setConfirmClear(false);
    setOpen((value) => !value);
  }

  function openItem(item: AppNotification) {
    setOpen(false);
    if (!item.isRead) {
      setState((current) =>
        current.status === "ready"
          ? {
              status: "ready",
              items: current.items.map((entry) => (entry.id === item.id ? { ...entry, isRead: true } : entry)),
              unread: Math.max(0, current.unread - 1),
            }
          : current,
      );
      markNotificationRead(item.id).catch((error: unknown) => {
        if (!isQuiet(error)) logError(error, "Failed to mark notification read");
        load();
      });
    }
    const path = notificationPath(item.type, item.data);
    if (path) router.push(path);
  }

  function markAllRead() {
    setState((current) =>
      current.status === "ready"
        ? { status: "ready", items: current.items.map((entry) => ({ ...entry, isRead: true })), unread: 0 }
        : current,
    );
    markAllNotificationsRead().catch((error: unknown) => {
      if (!isQuiet(error)) logError(error, "Failed to mark notifications read");
      load();
    });
  }

  // Removed at once; if the request fails the list is reloaded so it shows what is really there.
  function removeItem(item: AppNotification) {
    setState((current) =>
      current.status === "ready"
        ? {
            status: "ready",
            items: current.items.filter((entry) => entry.id !== item.id),
            unread: item.isRead ? current.unread : Math.max(0, current.unread - 1),
          }
        : current,
    );
    deleteNotification(item.id).catch((error: unknown) => {
      // Already gone (404) needs no undo.
      if (isApiError(error) && error.status === 404) return;
      if (!isQuiet(error)) logError(error, "Failed to delete notification");
      load();
    });
  }

  function clearAll() {
    setConfirmClear(false);
    setState((current) => (current.status === "ready" ? { status: "ready", items: [], unread: 0 } : current));
    clearAllNotifications().catch((error: unknown) => {
      if (!isQuiet(error)) logError(error, "Failed to clear notifications");
      load();
    });
  }

  const hasItems = state.status === "ready" && state.items.length > 0;
  const label = unread > 0 ? `${t("Notifications")}, ${unread}` : t("Notifications");

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={`relative box-border flex h-11 min-w-11 cursor-pointer items-center justify-center rounded-full px-3 shadow-[0_6px_20px_rgba(11,31,77,0.08)] outline-none transition-shadow duration-300 hover:shadow-[0_8px_24px_rgba(11,31,77,0.16)] focus-visible:ring-2 focus-visible:ring-navy/40 motion-reduce:transition-none ${open ? "bg-navy text-white" : "bg-white text-navy"}`}
      >
        <BellIcon />
        {unread > 0 ? (
          <span
            key={unread}
            className="badge-pop absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#e11d2e] px-1 font-manrope text-[10px] font-semibold leading-none text-white"
          >
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label={t("Notifications")}
          className="fixed inset-x-3 top-[72px] z-[55] overflow-hidden rounded-[16px] border border-[#e8edf2] bg-white shadow-[0_18px_48px_rgba(11,31,77,0.18)] sm:inset-x-auto sm:right-6 sm:w-[380px]"
        >
          <div className="flex items-center justify-between gap-3 border-b border-[#eef1f5] px-4 py-3">
            <div className="flex items-center gap-2">
              <h2 className="font-manrope text-[15px] font-semibold text-navy">{t("Notifications")}</h2>
              {unread > 0 ? (
                <span className="rounded-full bg-[#fdeeee] px-2 py-0.5 font-manrope text-[11px] font-semibold text-[#d64242]">
                  {unread}
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={markAllRead}
                disabled={unread === 0}
                className="cursor-pointer font-manrope text-[12px] font-medium text-navy hover:underline disabled:cursor-default disabled:text-[#b0b7c0] disabled:no-underline"
              >
                {t("Mark all as read")}
              </button>
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                disabled={!hasItems}
                className="cursor-pointer font-manrope text-[12px] font-medium text-[#d64242] hover:underline disabled:cursor-default disabled:text-[#b0b7c0] disabled:no-underline"
              >
                {t("Clear All")}
              </button>
            </div>
          </div>
          {confirmClear ? (
            <div role="alertdialog" aria-label={t("Clear all notifications?")} className="flex items-center justify-between gap-3 border-b border-[#f3d0d3] bg-[#fff6f6] px-4 py-3">
              <p className="font-manrope text-[12px] leading-4 text-[#7a2a30]">
                <strong className="block text-[13px] font-semibold text-[#b42318]">{t("Clear all notifications?")}</strong>
                {t("This can't be undone.")}
              </p>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="h-8 cursor-pointer rounded-[8px] border border-[#e4e9ef] bg-white px-3 font-manrope text-[12px] font-medium text-navy"
                >
                  {t("Cancel")}
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  className="h-8 cursor-pointer rounded-[8px] bg-[#d64242] px-3 font-manrope text-[12px] font-medium text-white hover:bg-[#b93636]"
                >
                  {t("Yes, clear")}
                </button>
              </div>
            </div>
          ) : null}

          <div className="max-h-[min(70svh,440px)] overflow-y-auto overscroll-contain [scrollbar-color:#c9d3e3_transparent] [scrollbar-width:thin]">
            {state.status === "loading" ? (
              <div aria-busy="true" className="space-y-1 p-3">
                {[0, 1, 2].map((key) => (
                  <div key={key} aria-hidden="true" className="h-[68px] animate-pulse rounded-[12px] bg-[#f3f6fa] motion-reduce:animate-none" />
                ))}
              </div>
            ) : state.status === "error" ? (
              <div role="alert" className="px-6 py-10 text-center">
                <p className="font-manrope text-[14px] font-semibold text-[#1a1a1a]">{t("We couldn't load your notifications.")}</p>
                <button
                  type="button"
                  onClick={() => {
                    setState({ status: "loading" });
                    load();
                  }}
                  className="mt-3 inline-flex h-9 cursor-pointer items-center rounded-[10px] bg-navy px-4 font-manrope text-[12px] font-medium text-white"
                >
                  {t("Try again")}
                </button>
              </div>
            ) : state.items.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-10 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#edf3ff] text-navy">
                  <BellIcon />
                </span>
                <p className="mt-3 font-manrope text-[14px] font-semibold text-[#1a1a1a]">{t("No notifications yet")}</p>
                <p className="mt-1 max-w-[240px] font-manrope text-[12px] leading-4 text-[#8b939e]">
                  {t("We'll let you know when there's an update.")}
                </p>
              </div>
            ) : (
              <ul className="p-1.5">
                {state.items.map((item) => (
                  <li key={item.id} className="group relative">
                    <button
                      type="button"
                      onClick={() => openItem(item)}
                      className={`flex w-full cursor-pointer items-start gap-3 rounded-[12px] py-3 pl-3 pr-10 text-left transition-colors hover:bg-[#f5f8fd] ${item.isRead ? "" : "bg-[#f3f7ff]"}`}
                    >
                      <span
                        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${item.isRead ? "bg-[#f1f4f9] text-[#8b939e]" : "bg-[#e2ecff] text-navy"}`}
                      >
                        <TypeIcon type={item.type} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block font-manrope text-[13px] leading-5 text-[#1a1a1a] ${item.isRead ? "font-medium" : "font-semibold"}`}>
                          {item.title}
                        </span>
                        <span className="mt-0.5 line-clamp-2 block break-words font-manrope text-[12px] leading-4 text-[#6b7785]">
                          {item.message}
                        </span>
                        <span className="mt-1 flex items-center gap-1.5 font-manrope text-[11px] leading-4 text-[#9aa3ad]">
                          {item.isRead ? null : (
                            <span aria-label={t("Unread")} className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#e11d2e]" />
                          )}
                          {formatAgo(item.createdAt, locale)}
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(item)}
                      aria-label={`${t("Delete notification")}: ${item.title}`}
                      title={t("Delete notification")}
                      className="absolute right-2 top-2.5 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-[#9aa3ad] opacity-0 transition hover:bg-[#fdeeee] hover:text-[#d64242] focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
                    >
                      <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5">
                        <path d="m4 4 8 8m0-8-8 8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
