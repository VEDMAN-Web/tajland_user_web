"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageLoader } from "@/components/ui/PageLoader";
import { isAbortError } from "@/lib/api/browser-client";
import { routes } from "@/lib/constants/routes";
import { useAuth } from "@/lib/hooks/useAuth";
import { logError } from "@/lib/logging/logger";
import { useDashboardLanguage } from "./DashboardLanguageContext";
import {
  formatReferralDate,
  referralShareLink,
  toReferralRow,
  toRewardRow,
} from "./referral.utils";
import type { ReferralDashboard } from "./schemas/referral.schema";
import {
  getReferralDashboard,
  getReferralHistory,
  getRewardTransactions,
} from "./services/referral.client";

type Translate = (source: string) => string;

type Row = {
  id: string;
  title: string;
  date: string | null;
  /** Referrals: "COMPLETED" / "PENDING" / ... . */
  status?: string | null;
  /** Points: positive earned, negative spent. */
  points?: number | null;
};

type ListState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; rows: Row[]; page: number; totalPages: number; loadingMore: boolean };

type Tab = "referrals" | "points";

const card = "rounded-[16px] bg-white shadow-[0_8px_28px_rgba(11,31,77,0.06)]";
const pointsFormat = new Intl.NumberFormat("en-US");

const STATUS_STYLE: Record<string, string> = {
  COMPLETED: "bg-[#eefaf3] text-[#168a56]",
  PENDING: "bg-[#fff6df] text-[#a06b00]",
};

function CopyIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-4 w-4 shrink-0">
      <rect x="5.5" y="5.5" width="8" height="8" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10.5 3.5v-.2a1.3 1.3 0 0 0-1.3-1.3H3.8a1.3 1.3 0 0 0-1.3 1.3v5.4a1.3 1.3 0 0 0 1.3 1.3h.2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-4 w-4 shrink-0">
      <path d="m3.5 8.5 3 3 6-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StatIcon({ name }: { name: "users" | "check" | "clock" | "star" }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      {name === "users" ? (
        <>
          <circle cx="9" cy="8.5" r="3" {...common} />
          <path d="M3.5 19c.7-3 2.8-4.5 5.5-4.5s4.8 1.5 5.5 4.5" {...common} />
          <path d="M16 6.2a3 3 0 0 1 0 5.6M17.5 14.7c1.7.5 2.8 1.9 3.2 4.3" {...common} />
        </>
      ) : null}
      {name === "check" ? (
        <>
          <circle cx="12" cy="12" r="8" {...common} />
          <path d="m8.5 12.2 2.3 2.3 4.7-5" {...common} />
        </>
      ) : null}
      {name === "clock" ? (
        <>
          <circle cx="12" cy="12" r="8" {...common} />
          <path d="M12 7.5V12l3 1.8" {...common} />
        </>
      ) : null}
      {name === "star" ? (
        <path d="m12 4 2.4 5 5.4.7-4 3.8 1 5.4-4.8-2.7-4.8 2.7 1-5.4-4-3.8 5.4-.7L12 4Z" {...common} />
      ) : null}
    </svg>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: "users" | "check" | "clock" | "star";
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className={`${card} flex items-center gap-3.5 px-4 py-4 sm:px-5`}>
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] ${tone}`}>
        <StatIcon name={icon} />
      </span>
      <div className="min-w-0">
        <p className="font-manrope text-[24px] font-semibold leading-7 tracking-[-0.02em] text-navy">{value}</p>
        <p className="font-manrope truncate text-[12px] leading-4 text-[#8b939e]">{label}</p>
      </div>
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className={`${card} h-[76px] animate-pulse motion-reduce:animate-none`} />
      ))}
    </div>
  );
}

/** Copy to the clipboard; false when the browser refuses (no permission, insecure page). */
async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

function CopyButton({
  value,
  label,
  className,
  t,
}: {
  value: string;
  label: string;
  className: string;
  t: Translate;
}) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    setState((await copyText(value)) ? "copied" : "failed");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 2000);
  }

  return (
    <button type="button" onClick={copy} disabled={!value} className={className}>
      {state === "copied" ? <CheckIcon /> : <CopyIcon />}
      <span aria-live="polite">
        {state === "copied" ? t("Copied") : state === "failed" ? t("Couldn't copy") : label}
      </span>
    </button>
  );
}

function subscribeNever() {
  return () => undefined;
}

function Hero({ dashboard, t }: { dashboard: ReferralDashboard; t: Translate }) {
  // The site's own address, so a shared link opens this site's signup page. The server
  // render has none, so the first client render matches it and the link follows.
  // The site's own address from the env (so a shared link always points at the real domain,
  // not a preview URL); this page's origin when it isn't set. No trailing slash.
  const origin = useSyncExternalStore(
    subscribeNever,
    () => (process.env.NEXT_PUBLIC_SITE_URL || window.location.origin).replace(/\/+$/, ""),
    () => "",
  );
  const link = origin ? referralShareLink(origin, dashboard.code) : "";

  return (
    <div className="relative overflow-hidden rounded-[20px] bg-linear-to-br from-[#12307a] to-[#071536] p-5 text-white shadow-[0_24px_50px_-28px_rgba(11,31,77,0.7)] sm:p-7">
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/[0.06]" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-[#e11d2e]/[0.14] blur-2xl" />

      <div className="relative flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white/12 text-white ring-1 ring-white/15">
          <GiftGlyph />
        </span>
        <div className="min-w-0">
          <p className="font-manrope text-[15px] font-semibold leading-5">{t("Invite friends, earn points")}</p>
          <p className="font-manrope text-[12px] leading-4 text-white/65">{t("Share your code or link below.")}</p>
        </div>
      </div>

      <div className="relative mt-5 grid gap-4 md:grid-cols-2">
        <div className="min-w-0 rounded-[16px] border border-white/15 bg-white/[0.07] p-4">
          <p className="font-manrope text-[11px] font-semibold uppercase tracking-[0.12em] text-white/65">
            {t("Your referral code")}
          </p>
          <p className="mt-2 break-all font-manrope text-[30px] font-semibold leading-none tracking-[0.1em] sm:text-[34px]">
            {dashboard.code}
          </p>
          <CopyButton
            value={dashboard.code}
            label={t("Copy code")}
            t={t}
            className="mt-4 inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-[12px] bg-white px-5 font-manrope text-[13px] font-semibold text-navy transition-colors hover:bg-[#eef3ff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          />
        </div>

        <div className="min-w-0 rounded-[16px] border border-white/15 bg-white/[0.07] p-4">
          <p className="font-manrope text-[11px] font-semibold uppercase tracking-[0.12em] text-white/65">
            {t("Your invite link")}
          </p>
          <input
            readOnly
            value={link}
            aria-label={t("Your invite link")}
            onFocus={(event) => event.currentTarget.select()}
            className="mt-2 h-[34px] w-full truncate rounded-[10px] bg-transparent font-manrope text-[14px] text-white/90 outline-none"
          />
          <CopyButton
            value={link}
            label={t("Copy link")}
            t={t}
            className="mt-[18px] inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-[12px] border border-white/25 bg-white/10 px-5 font-manrope text-[13px] font-semibold text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-60"
          />
        </div>
      </div>
    </div>
  );
}

function GiftGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <rect x="3.5" y="9" width="17" height="11" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 9v11M3.5 13.5h17M12 9c-1.5-3.5-5-4-5-1.8C7 8.4 8.6 9 12 9Zm0 0c1.5-3.5 5-4 5-1.8C17 8.4 15.4 9 12 9Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
    </svg>
  );
}

function HowItWorks({ t }: { t: Translate }) {
  const steps = [
    { title: "Share your link", body: "Send your code or invite link to friends." },
    { title: "They sign up", body: "Your friend creates an account with your code." },
    { title: "You earn points", body: "Points are added once the referral is completed." },
  ];

  return (
    <section className={`${card} p-5 sm:p-6`}>
      <h2 className="font-manrope text-[16px] font-semibold leading-5 text-navy">{t("How it works")}</h2>
      <ol className="mt-5">
        {steps.map((step, index) => (
          <li key={step.title} className="relative flex gap-4 pb-6 last:pb-0">
            {index < steps.length - 1 ? (
              <span aria-hidden="true" className="absolute left-[15px] top-8 h-[calc(100%-2rem)] w-px bg-[#e4e9ef]" />
            ) : null}
            <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy font-manrope text-[13px] font-semibold text-white ring-4 ring-[#eef3ff]">
              {index + 1}
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="font-manrope text-[14px] font-semibold leading-5 text-[#1a1a1a]">{t(step.title)}</p>
              <p className="font-manrope mt-1 text-[13px] leading-5 text-[#8b939e]">{t(step.body)}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function HelpCard({ t }: { t: Translate }) {
  return (
    <section className={`${card} p-5 sm:p-6`}>
      <h2 className="font-manrope text-[16px] font-semibold leading-5 text-navy">{t("Need help?")}</h2>
      <p className="font-manrope mt-2 text-[13px] leading-5 text-[#8b939e]">
        {t("Questions about referrals? Our support team is here to help.")}
      </p>
      <Link
        href={routes.helpSupport}
        className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-[12px] bg-navy px-5 font-manrope text-[13px] font-semibold text-white transition-colors hover:bg-navy-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
      >
        {t("Contact support")}
      </Link>
      <Link
        href={routes.dashboardTerms}
        className="mt-3 block text-center font-manrope text-[12px] font-medium text-[#66717c] underline-offset-4 hover:text-navy hover:underline"
      >
        {t("Term & Condition")}
      </Link>
    </section>
  );
}

function ActivityList({ tab, t }: { tab: Tab; t: Translate }) {
  const [state, setState] = useState<ListState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(
    async (page: number, signal?: AbortSignal) => {
      const data =
        tab === "referrals" ? await getReferralHistory(page, signal) : await getRewardTransactions(page, signal);
      const rows: Row[] = data.items.map((item, index) => {
        if (tab === "referrals") {
          const row = toReferralRow(item, index);
          return { id: row.id, title: row.name ?? t("Friend"), date: row.date, status: row.status, points: row.points };
        }
        const row = toRewardRow(item, index);
        return { id: row.id, title: row.title ?? t("Reward"), date: row.date, points: row.points };
      });
      return { rows, page: data.pagination.page, totalPages: data.pagination.totalPages };
    },
    [tab, t],
  );

  useEffect(() => {
    const controller = new AbortController();
    load(1, controller.signal)
      .then((first) => setState({ status: "ready", ...first, loadingMore: false }))
      .catch((error: unknown) => {
        if (isAbortError(error)) return;
        logError(error, "Failed to load referral activity");
        setState({ status: "error" });
      });
    return () => controller.abort();
    // `t` changes with the language; the list itself doesn't need a reload for that.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, reloadKey]);

  async function loadMore() {
    if (state.status !== "ready" || state.loadingMore) return;
    setState({ ...state, loadingMore: true });
    try {
      const next = await load(state.page + 1);
      setState({ status: "ready", ...next, rows: [...state.rows, ...next.rows], loadingMore: false });
    } catch (error) {
      if (isAbortError(error)) return;
      logError(error, "Failed to load more referral activity");
      setState({ ...state, loadingMore: false });
    }
  }

  if (state.status === "loading") {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="h-14 animate-pulse rounded-[12px] bg-[#eef1f5] motion-reduce:animate-none" />
        ))}
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="px-6 py-10 text-center">
        <p className="font-manrope text-[14px] font-semibold text-[#1a1a1a]">{t("We couldn't load this list.")}</p>
        <button
          type="button"
          onClick={() => {
            setState({ status: "loading" });
            setReloadKey((key) => key + 1);
          }}
          className="mt-3 inline-flex h-9 cursor-pointer items-center rounded-full bg-navy px-5 font-manrope text-[12px] font-medium text-white hover:bg-navy-deep"
        >
          {t("Try again")}
        </button>
      </div>
    );
  }

  if (state.rows.length === 0) {
    const referrals = tab === "referrals";
    return (
      <div className="flex flex-col items-center px-6 py-12 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#edf3ff] text-navy">
          <StatIcon name={referrals ? "users" : "star"} />
        </span>
        <p className="font-manrope mt-3 text-[14px] font-semibold text-[#1a1a1a]">
          {t(referrals ? "No referrals yet" : "No points yet")}
        </p>
        <p className="font-manrope mt-1 max-w-[300px] text-[12px] leading-4 text-[#8b939e]">
          {t(referrals ? "Share your link and your friends will appear here." : "Points you earn from referrals will show here.")}
        </p>
      </div>
    );
  }

  return (
    <div>
      <ul className="divide-y divide-[#eef1f4]">
        {state.rows.map((row) => {
          const date = formatReferralDate(row.date);
          const statusStyle = row.status ? (STATUS_STYLE[row.status] ?? "bg-[#eef1f4] text-[#66717c]") : null;
          const points = row.points ?? null;
          return (
            <li key={row.id} className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
              <span
                aria-hidden="true"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e2ecff] font-manrope text-[14px] font-semibold uppercase text-navy"
              >
                {row.title.charAt(0)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-manrope truncate text-[14px] font-semibold leading-5 text-[#1a1a1a]">{row.title}</p>
                {date ? <p className="font-manrope text-[12px] leading-4 text-[#8b939e]">{date}</p> : null}
              </div>
              {tab === "referrals" && row.status ? (
                <span className={`font-manrope rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize leading-none ${statusStyle}`}>
                  {t(row.status.charAt(0) + row.status.slice(1).toLowerCase())}
                </span>
              ) : null}
              {points !== null ? (
                <span
                  className={`font-manrope shrink-0 text-[14px] font-semibold ${points < 0 ? "text-[#d64242]" : "text-[#168a56]"}`}
                >
                  {points > 0 ? "+" : ""}
                  {pointsFormat.format(points)} {t("pts")}
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
      {state.page < state.totalPages ? (
        <div className="border-t border-[#eef1f4] p-3 text-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={state.loadingMore}
            className="inline-flex h-9 cursor-pointer items-center rounded-full border border-[#e4e9ef] px-5 font-manrope text-[12px] font-medium text-navy hover:bg-[#f4f7fa] disabled:cursor-default disabled:opacity-60"
          >
            {state.loadingMore ? t("Loading...") : t("Load more")}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function ReferralPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useDashboardLanguage();
  const [dashboard, setDashboard] = useState<
    { status: "loading" } | { status: "error" } | { status: "ready"; data: ReferralDashboard }
  >({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);
  const [tab, setTab] = useState<Tab>("referrals");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace(routes.login);
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const controller = new AbortController();
    getReferralDashboard(controller.signal)
      .then((data) => setDashboard({ status: "ready", data }))
      .catch((error: unknown) => {
        if (isAbortError(error)) return;
        logError(error, "Failed to load referral dashboard");
        setDashboard({ status: "error" });
      });
    return () => controller.abort();
  }, [isAuthenticated, reloadKey]);

  if (isLoading || !isAuthenticated) {
    return <PageLoader label={t("Loading referrals...")} />;
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "referrals", label: "Referrals" },
    { key: "points", label: "Points history" },
  ];

  return (
    <div className="min-h-[100svh] bg-[#f7f9fc] text-navy">
      <main className="w-full px-5 pb-14 pt-6 sm:px-8 lg:p-0 lg:[&>section]:mx-0 lg:[&>section]:w-full lg:[&>section]:max-w-[1280px] lg:[&>section]:px-10 lg:[&>section]:py-8">
        <section className="min-w-0">
          <h1 className="font-manrope text-[28px] font-semibold leading-none tracking-[-0.03em] text-navy sm:text-[32px]">
            {t("Refer & Earn")}
          </h1>
          <p className="font-manrope mt-2 text-[14px] leading-5 text-[#8b939e]">
            {t("Invite friends to Tajlandia and earn points.")}
          </p>

          {dashboard.status === "loading" ? (
            <>
              <div className={`${card} mt-6 h-[250px] animate-pulse motion-reduce:animate-none`} />
              <StatsSkeleton />
            </>
          ) : dashboard.status === "error" ? (
            <div className={`${card} mt-5 px-6 py-10 text-center`}>
              <p className="font-manrope text-[14px] font-semibold text-[#1a1a1a]">
                {t("We couldn't load your referral details.")}
              </p>
              <button
                type="button"
                onClick={() => {
                  setDashboard({ status: "loading" });
                  setReloadKey((key) => key + 1);
                }}
                className="mt-3 inline-flex h-9 cursor-pointer items-center rounded-full bg-navy px-5 font-manrope text-[12px] font-medium text-white hover:bg-navy-deep"
              >
                {t("Try again")}
              </button>
            </div>
          ) : (
            <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
              <div className="min-w-0 space-y-5">
                <Hero dashboard={dashboard.data} t={t} />

                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <StatCard icon="users" label={t("Total referrals")} value={pointsFormat.format(dashboard.data.totalReferrals)} tone="bg-[#e8f0ff] text-[#2f5fd0]" />
                  <StatCard icon="check" label={t("Completed")} value={pointsFormat.format(dashboard.data.completedReferrals)} tone="bg-[#eefaf3] text-[#168a56]" />
                  <StatCard icon="clock" label={t("Pending")} value={pointsFormat.format(dashboard.data.pendingReferrals)} tone="bg-[#fff6df] text-[#a06b00]" />
                  <StatCard icon="star" label={t("Points earned")} value={pointsFormat.format(dashboard.data.totalPointsEarned)} tone="bg-[#fdeeee] text-[#d64242]" />
                </div>

                <div className={`${card} overflow-hidden`}>
                  <div role="tablist" aria-label={t("Referral activity")} className="flex gap-1 border-b border-[#eef1f4] px-3 pt-2 sm:px-4">
                    {tabs.map((item) => {
                      const selected = item.key === tab;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          role="tab"
                          aria-selected={selected}
                          onClick={() => setTab(item.key)}
                          className={`font-manrope -mb-px cursor-pointer border-b-2 px-3 py-3 text-[13px] font-semibold leading-none transition-colors ${selected ? "border-navy text-navy" : "border-transparent text-[#8b939e] hover:text-navy"}`}
                        >
                          {t(item.label)}
                        </button>
                      );
                    })}
                  </div>
                  <div role="tabpanel">
                    <ActivityList key={tab} tab={tab} t={t} />
                  </div>
                </div>
              </div>

              <div className="min-w-0 space-y-5 xl:sticky xl:top-24">
                <HowItWorks t={t} />
                <HelpCard t={t} />
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
