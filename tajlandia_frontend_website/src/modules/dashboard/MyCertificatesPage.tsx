"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { isAbortError } from "@/lib/api/browser-client";
import { isApiError } from "@/lib/api/errors";
import { routes } from "@/lib/constants/routes";
import { useAuth } from "@/lib/hooks/useAuth";
import { logError } from "@/lib/logging/logger";
import { PageLoader } from "@/components/ui/PageLoader";
import { CertificateDownloadFailedDialog } from "./CertificateDownloadFailedDialog";
import { CertificatePreview } from "./CertificatePreview";
import { useDashboardLanguage } from "./DashboardLanguageContext";
import type { CertificateListItem } from "./schemas/certificates.schema";
import {
  downloadCertificate,
  getCertificates,
  type CertificateListQuery,
} from "./services/certificates.client";

type SortOption = "recommended" | "oldest" | "newest" | "id-asc" | "id-desc";
type CertificatesState =
  | { status: "loading" }
  | {
      status: "ready";
      certificates: CertificateListItem[];
      page: number;
      totalPages: number;
      loadingMore: boolean;
      loadMoreFailed: boolean;
    }
  | { status: "error" };

// Four cards per row on wide screens; 12 divides evenly by 1, 2, 3, and 4.
const PAGE_SIZE = 12;

const SORT_QUERY: Record<SortOption, Pick<CertificateListQuery, "sortBy" | "sortOrder">> = {
  recommended: { sortBy: "createdAt", sortOrder: "desc" },
  newest: { sortBy: "createdAt", sortOrder: "desc" },
  oldest: { sortBy: "createdAt", sortOrder: "asc" },
  "id-asc": { sortBy: "certificateNo", sortOrder: "asc" },
  "id-desc": { sortBy: "certificateNo", sortOrder: "desc" },
};

/** One type only when exactly one box is ticked; both (or neither) means no type filter. */
function typeFilter(myCertificates: boolean, gifted: boolean): CertificateListQuery["type"] {
  if (myCertificates && !gifted) return "MY_CERTIFICATES";
  if (gifted && !myCertificates) return "GIFTED";
  return undefined;
}

const isQuietError = (error: unknown) =>
  isAbortError(error) || (isApiError(error) && error.code === "API_SESSION_EXPIRED");

function formatIssued(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function FilterGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5">
      <path d="M7 5v14M12 5v14M17 5v14M4.5 8h5M9.5 15h5M14.5 10h5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
    </svg>
  );
}

function SortGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5">
      <path d="M8 5v14m0 0-3-3m3 3 3-3M16 19V5m0 0-3 3m3-3 3 3" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
    </svg>
  );
}

function DownloadGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5">
      <path d="M12 4v10m0 0 3.2-3.2M12 14 8.8 10.8M5 18.5h14" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  );
}

function GiftGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3 w-3 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13" />
      <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
      <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 4.8 0 0 1 12 8a4.8 4.8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
    </svg>
  );
}

const sortLabels: Array<{ value: SortOption; label: string; detail: string }> = [
  { value: "recommended", label: "Recommended", detail: "Curated by newly added" },
  { value: "oldest", label: "Date: Old to New", detail: "" },
  { value: "newest", label: "Date: New to Old", detail: "" },
  { value: "id-asc", label: "Certificate ID (A-Z)", detail: "" },
  { value: "id-desc", label: "Certificate ID (Z-A)", detail: "" },
];

export function MyCertificatesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useDashboardLanguage();
  const [state, setState] = useState<CertificatesState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);
  const [dialog, setDialog] = useState<"sort" | "filter" | null>(null);
  const [sort, setSort] = useState<SortOption>("recommended");
  const [draftSort, setDraftSort] = useState<SortOption>("recommended");
  // Both ticked: every certificate.
  const [showMyCertificates, setShowMyCertificates] = useState(true);
  const [showGifted, setShowGifted] = useState(true);
  const [draftMyCertificates, setDraftMyCertificates] = useState(true);
  const [draftGifted, setDraftGifted] = useState(true);
  // How many own / gifted certificates exist, for the Filter dialog's "found" count.
  const [typeTotals, setTypeTotals] = useState<{ my: number; gifted: number } | null>(null);
  // Bumped on every new first-page load, so a "Load more" for old filters is dropped.
  const listVersionRef = useRef(0);
  const nothingSelected = !showMyCertificates && !showGifted;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace(routes.login);
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    // Neither box ticked shows nothing (the API would return everything).
    if (!isAuthenticated || nothingSelected) return;
    const version = ++listVersionRef.current;
    const controller = new AbortController();
    getCertificates(
      { type: typeFilter(showMyCertificates, showGifted), ...SORT_QUERY[sort], page: 1, limit: PAGE_SIZE },
      controller.signal,
    )
      .then((result) => {
        if (version !== listVersionRef.current) return;
        setState({
          status: "ready",
          certificates: result.items,
          page: result.pagination.page,
          totalPages: result.pagination.totalPages,
          loadingMore: false,
          loadMoreFailed: false,
        });
      })
      .catch((error: unknown) => {
        if (isQuietError(error)) return;
        logError(error, "Failed to load certificates");
        setState({ status: "error" });
      });
    return () => controller.abort();
  }, [isAuthenticated, reloadKey, sort, showMyCertificates, showGifted, nothingSelected]);

  useEffect(() => {
    if (dialog !== "filter" || typeTotals) return;
    const controller = new AbortController();
    const totalFor = (type: CertificateListQuery["type"]) =>
      getCertificates({ type, ...SORT_QUERY.recommended, page: 1, limit: 1 }, controller.signal).then(
        (result) => result.pagination.total,
      );
    Promise.all([totalFor("MY_CERTIFICATES"), totalFor("GIFTED")])
      .then(([my, gifted]) => setTypeTotals({ my, gifted }))
      .catch((error: unknown) => {
        if (!isQuietError(error)) logError(error, "Failed to count certificates");
      });
    return () => controller.abort();
  }, [dialog, typeTotals]);

  if (isLoading || !isAuthenticated) return <PageLoader label={t("Loading certificates...")} />;

  const filtersActive = !showMyCertificates || !showGifted;
  const sortActive = sort !== "recommended";
  // With neither box ticked nothing is fetched, so the list is simply empty.
  const status = nothingSelected ? "ready" : state.status;
  const certificates = state.status === "ready" && !nothingSelected ? state.certificates : [];
  const hasMore = state.status === "ready" && !nothingSelected && state.page < state.totalPages;
  const draftFound = typeTotals
    ? (draftMyCertificates ? typeTotals.my : 0) + (draftGifted ? typeTotals.gifted : 0)
    : null;

  // New filters or sort: start again from page 1 (the effect loads it).
  function applyQuery(next: { sort: SortOption; myCertificates: boolean; gifted: boolean }) {
    const changed = next.sort !== sort || next.myCertificates !== showMyCertificates || next.gifted !== showGifted;
    if (changed && (next.myCertificates || next.gifted)) setState({ status: "loading" });
    setSort(next.sort);
    setShowMyCertificates(next.myCertificates);
    setShowGifted(next.gifted);
    setDialog(null);
  }

  async function loadMore() {
    if (state.status !== "ready" || state.loadingMore || !hasMore) return;
    const version = listVersionRef.current;
    setState({ ...state, loadingMore: true, loadMoreFailed: false });
    try {
      const result = await getCertificates({
        type: typeFilter(showMyCertificates, showGifted),
        ...SORT_QUERY[sort],
        page: state.page + 1,
        limit: PAGE_SIZE,
      });
      if (version !== listVersionRef.current) return;
      setState((current) =>
        current.status === "ready"
          ? {
              ...current,
              // Skip any certificate already shown (a new one can shift the pages).
              certificates: [
                ...current.certificates,
                ...result.items.filter((item) => !current.certificates.some((shown) => shown.orderId === item.orderId)),
              ],
              page: result.pagination.page,
              totalPages: result.pagination.totalPages,
              loadingMore: false,
            }
          : current,
      );
    } catch (error) {
      if (version !== listVersionRef.current || isQuietError(error)) return;
      logError(error, "Failed to load more certificates");
      setState((current) => (current.status === "ready" ? { ...current, loadingMore: false, loadMoreFailed: true } : current));
    }
  }

  function openSort() {
    setDraftSort(sort);
    setDialog("sort");
  }
  function openFilter() {
    setDraftMyCertificates(showMyCertificates);
    setDraftGifted(showGifted);
    setDialog("filter");
  }

  return (
    <div className="min-h-[100svh] bg-[#f7f9fc] text-navy">
      <main className="w-full px-5 pb-14 pt-6 sm:px-8 lg:p-0 lg:[&>section]:mx-auto lg:[&>section]:w-full lg:[&>section]:px-10 lg:[&>section]:py-8">
        <section className="min-w-0">
          <h1 className="font-manrope text-[28px] font-semibold leading-none tracking-[-0.03em] text-navy sm:text-[32px]">
            {t("My Certificates")}
          </h1>
          <p className="mt-2 font-manrope text-[14px] leading-5 text-[#8b939e]">
            {t("View and download your land ownership certificates.")}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-manrope text-[16px] font-semibold text-navy">{t("All Certificates")}</h2>
            <div className="flex flex-wrap items-center gap-2">
              {filtersActive || sortActive ? (
                <button
                  type="button"
                  onClick={() => applyQuery({ sort: "recommended", myCertificates: true, gifted: true })}
                  className="inline-flex h-9 cursor-pointer items-center rounded-[10px] border border-[#f1c7c7] bg-white px-3 font-manrope text-[12px] font-medium text-[#d64242] hover:bg-[#fdeeee]"
                >
                  {t("Clear All")}
                </button>
              ) : null}
              <button
                type="button"
                onClick={openFilter}
                disabled={status !== "ready"}
                className={`inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[10px] border bg-white px-3 font-manrope text-[12px] font-medium disabled:cursor-not-allowed disabled:opacity-50 ${
                  filtersActive ? "border-navy text-navy" : "border-[#e4e9ef] text-[#8b939e]"
                }`}
              >
                <FilterGlyph />
                {t("Filter")}
                {filtersActive ? (
                  <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-navy px-1 text-[10px] font-semibold leading-none text-white">
                    1
                  </span>
                ) : null}
              </button>
              <button
                type="button"
                onClick={openSort}
                disabled={status !== "ready"}
                className={`inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[10px] border bg-white px-3 font-manrope text-[12px] font-medium disabled:cursor-not-allowed disabled:opacity-50 ${
                  sort !== "recommended" ? "border-navy text-navy" : "border-[#e4e9ef] text-[#8b939e]"
                }`}
              >
                <SortGlyph />
                {t("Sort")}
              </button>
            </div>
          </div>
          {status === "loading" ? (
            <div aria-busy="true" className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <span className="sr-only" role="status">
                {t("Loading certificates...")}
              </span>
              {[0, 1, 2, 3].map((key) => (
                <div
                  key={key}
                  aria-hidden="true"
                  className="h-[330px] animate-pulse rounded-[16px] border border-[#eef1f4] bg-white motion-reduce:animate-none"
                />
              ))}
            </div>
          ) : status === "error" ? (
            <div role="alert" className="mt-4 rounded-[16px] bg-white px-6 py-10 text-center">
              <p className="font-manrope text-[15px] font-semibold text-[#1a1a1a]">{t("We couldn't load your certificates.")}</p>
              <p className="mt-1 font-manrope text-[13px] text-[#8b939e]">{t("Please check your connection and try again.")}</p>
              <button
                type="button"
                onClick={() => {
                  setState({ status: "loading" });
                  setReloadKey((key) => key + 1);
                }}
                className="mt-4 inline-flex h-11 cursor-pointer items-center rounded-[12px] bg-navy px-5 font-manrope text-[13px] font-medium text-white"
              >
                {t("Try again")}
              </button>
            </div>
          ) : certificates.length ? (
            <>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {certificates.map((certificate) => (
                  <CertificateCard key={certificate.orderId} certificate={certificate} />
                ))}
              </div>
              {state.status === "ready" && state.loadMoreFailed ? (
                <p role="alert" className="mt-6 text-center font-manrope text-[13px] text-[#d52b35]">
                  {t("We couldn't load your certificates.")} {t("Please check your connection and try again.")}
                </p>
              ) : null}
              {hasMore ? (
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={state.status === "ready" && state.loadingMore}
                  aria-busy={state.status === "ready" && state.loadingMore}
                  className="mx-auto mt-6 flex h-11 cursor-pointer items-center rounded-[12px] border border-[#e6ebf0] bg-white px-6 font-manrope text-[13px] font-medium text-navy disabled:cursor-wait disabled:opacity-60"
                >
                  {state.status === "ready" && state.loadingMore ? t("Loading...") : t("Load more")}
                </button>
              ) : null}
            </>
          ) : (
            <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#edf4ff] text-2xl text-navy">
                ▤
              </div>
              <h2 className="mt-4 font-manrope text-[19px] font-semibold text-[#171717]">
                {filtersActive ? t("No certificates match the selected filters.") : t("No certificates available")}
              </h2>
              {filtersActive ? (
                <button
                  type="button"
                  onClick={() => applyQuery({ sort, myCertificates: true, gifted: true })}
                  className="mt-3 cursor-pointer font-manrope text-[13px] font-medium text-navy underline underline-offset-4"
                >
                  {t("Clear filters")}
                </button>
              ) : (
                <p className="mt-1 max-w-[320px] font-manrope text-[12px] leading-4 text-[#7b858f]">
                  {t("Your certificate appears here as soon as a purchase is paid.")}
                </p>
              )}
            </div>
          )}
        </section>
      </main>
      {dialog === "sort" ? (
        <SortDialog
          value={draftSort}
          onChange={setDraftSort}
          onClose={() => setDialog(null)}
          onApply={() => applyQuery({ sort: draftSort, myCertificates: showMyCertificates, gifted: showGifted })}
        />
      ) : null}
      {dialog === "filter" ? (
        <FilterDialog
          found={draftFound}
          myCertificates={draftMyCertificates}
          gifted={draftGifted}
          onMyCertificatesChange={setDraftMyCertificates}
          onGiftedChange={setDraftGifted}
          onClose={() => setDialog(null)}
          onReset={() => {
            setDraftMyCertificates(true);
            setDraftGifted(true);
          }}
          onApply={() => applyQuery({ sort, myCertificates: draftMyCertificates, gifted: draftGifted })}
        />
      ) : null}
    </div>
  );
}

function SortDialog({
  value,
  onChange,
  onClose,
  onApply,
}: {
  value: SortOption;
  onChange: (value: SortOption) => void;
  onClose: () => void;
  onApply: () => void;
}) {
  const { t } = useDashboardLanguage();
  return (
    <ModalShell>
      <DialogHeader icon={<SortGlyph />} title={t("Sort by")} subtitle={t("Reorder active parcel markers")} onClose={onClose} />
      <div className="space-y-0.5 px-3 py-2">
        {sortLabels.map((option) => {
          const selected = value === option.value;
          return (
            <label key={option.value} className={`flex cursor-pointer items-center gap-3 rounded-[12px] px-3 py-2.5 ${selected ? "bg-[#f3f7ff]" : ""}`}>
              <input type="radio" name="certificate-sort" checked={selected} onChange={() => onChange(option.value)} className="sr-only" />
              <ChoiceMark checked={selected} />
              <span className="min-w-0 flex-1">
                <span className={`block font-manrope text-[14px] leading-5 ${selected ? "font-semibold text-navy" : "font-medium text-[#8b939e]"}`}>{t(option.label)}</span>
                {option.detail ? <span className="mt-0.5 block font-manrope text-[12px] leading-4 font-normal text-[#8b939e]">{t(option.detail)}</span> : null}
              </span>
              {option.value === "recommended" ? (
                <span className="rounded-full bg-[#e7eefc] px-2 py-1 font-manrope text-[10px] font-semibold tracking-[0.04em] text-[#3b5ccc]">{t("DEFAULT")}</span>
              ) : null}
            </label>
          );
        })}
      </div>
      <DialogActions onReset={() => onChange("recommended")} onApply={onApply} applyLabel={t("Apply")} resetLabel={t("Reset")} />
    </ModalShell>
  );
}

function FilterDialog({
  found,
  myCertificates,
  gifted,
  onMyCertificatesChange,
  onGiftedChange,
  onClose,
  onReset,
  onApply,
}: {
  /** Certificates the draft filter matches; null while counting. */
  found: number | null;
  myCertificates: boolean;
  gifted: boolean;
  onMyCertificatesChange: (value: boolean) => void;
  onGiftedChange: (value: boolean) => void;
  onClose: () => void;
  onReset: () => void;
  onApply: () => void;
}) {
  const { t } = useDashboardLanguage();
  return (
    <ModalShell>
      <DialogHeader icon={<FilterGlyph />} title={t("Filter Certificates")} subtitle={t("Show your own or gifted certificates")} onClose={onClose} />
      <div className="border-b border-[#eef1f4] px-5 py-4">
        <p className="font-manrope text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8b939e]">{t("Certificates")}</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <CheckOption label={t("My Certificates")} checked={myCertificates} onChange={onMyCertificatesChange} />
          <CheckOption label={t("Gifted")} checked={gifted} onChange={onGiftedChange} />
        </div>
      </div>
      <div className="flex items-center justify-between bg-[#f7f9fc] px-5 py-4">
        <button type="button" onClick={onReset} className="cursor-pointer font-manrope text-[13px] text-[#8b939e]">
          {t("Clear All")}
        </button>
        <div className="flex items-center gap-3">
          {found !== null ? <span className="font-manrope text-[12px] text-[#8b939e]">{found} {t("certificates found")}</span> : null}
          <button type="button" onClick={onApply} className="cursor-pointer rounded-[10px] bg-navy px-4 py-2.5 font-manrope text-[13px] font-medium text-white">
            {t("Apply Filters")}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function ChoiceMark({ checked }: { checked: boolean }) {
  return (
    <span className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-[1.5px] ${checked ? "border-navy" : "border-[#d5dbe3]"}`}>
      {checked ? <span className="h-2.5 w-2.5 rounded-full bg-navy" /> : null}
    </span>
  );
}

function CheckOption({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex h-11 cursor-pointer items-center gap-2.5 rounded-[10px] border border-[#e4e9ef] bg-white px-3">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="sr-only" />
      <span className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[4px] border ${checked ? "border-navy bg-navy text-white" : "border-[#d5dbe3] bg-white"}`}>
        {checked ? (
          <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3 w-3">
            <path d="M3.5 8.2 6.4 11l6.1-6.2" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
          </svg>
        ) : null}
      </span>
      <span className={`truncate font-manrope text-[13px] ${checked ? "font-medium text-navy" : "text-[#8b939e]"}`}>{label}</span>
    </label>
  );
}

function ModalShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#121417]/45 p-4">
      <section role="dialog" aria-modal="true" className="max-h-[92svh] w-full max-w-[400px] overflow-y-auto rounded-[18px] bg-white shadow-[0_24px_60px_rgba(11,31,77,0.28)]">
        {children}
      </section>
    </div>
  );
}

function DialogHeader({
  icon,
  title,
  subtitle,
  onClose,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClose: () => void;
}) {
  const { t } = useDashboardLanguage();
  return (
    <div className="flex items-start gap-3 px-5 pb-2 pt-5">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#f2f4f7] text-navy">{icon}</span>
      <div className="min-w-0 flex-1">
        <h2 className="font-manrope text-[18px] font-semibold leading-6 text-navy">{title}</h2>
        <p className="font-manrope text-[12px] leading-4 text-[#8b939e]">{subtitle}</p>
      </div>
      <button type="button" onClick={onClose} aria-label={t("Close")} className="cursor-pointer font-manrope text-[22px] leading-none text-[#9aa3ad]">
        ×
      </button>
    </div>
  );
}

function DialogActions({
  onReset,
  onApply,
  applyLabel,
  resetLabel,
}: {
  onReset: () => void;
  onApply: () => void;
  applyLabel: string;
  resetLabel: string;
}) {
  return (
    <div className="mt-2 flex items-center justify-between bg-[#f7f9fc] px-5 py-4">
      <button type="button" onClick={onReset} className="cursor-pointer font-manrope text-[13px] text-[#8b939e]">
        {resetLabel}
      </button>
      <button type="button" onClick={onApply} className="cursor-pointer rounded-[10px] bg-navy px-5 py-2.5 font-manrope text-[13px] font-medium text-white">
        {applyLabel}
      </button>
    </div>
  );
}

function CertificateCard({ certificate }: { certificate: CertificateListItem }) {
  const { t } = useDashboardLanguage();
  const router = useRouter();
  const [downloading, setDownloading] = useState(false);
  const [failed, setFailed] = useState(false);
  const issued = formatIssued(certificate.createdAt);
  const isGift = certificate.purchaseType === "GIFT";

  async function download() {
    if (downloading) return;
    setDownloading(true);
    const result = await downloadCertificate(certificate.orderId);
    setDownloading(false);
    if (result.ok) return;
    if (result.sessionExpired) {
      router.replace(routes.login);
      return;
    }
    setFailed(true);
  }

  return (
    <article
      className={`relative rounded-[16px] px-4 pb-4 pt-5 transition-all duration-200 ${
        isGift
          ? "border-2 border-[#f5b838] bg-white shadow-[0_4px_16px_rgba(11,31,77,0.05)] hover:shadow-[0_8px_22px_rgba(11,31,77,0.09)]"
          : "border border-[#eef1f4] bg-white shadow-[0_4px_16px_rgba(11,31,77,0.05)] hover:shadow-[0_8px_22px_rgba(11,31,77,0.09)]"
      }`}
    >
      <div className="relative mx-auto aspect-[616/898] w-[68%] max-w-[210px]">
        <CertificatePreview
          url={certificate.certificateUrl}
          alt={`${t("Certificate ID")}: ${certificate.certificateNo}`}
          sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        />
      </div>
      <div className="mt-4 flex items-center justify-between gap-2">
        <p className="min-w-0 truncate font-manrope text-[12px] leading-4 text-[#8b939e]">
          {t("Generated on")} {issued}
        </p>
        {isGift ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#f5b838]/40 bg-[#fff7e6] px-2.5 py-0.5 font-manrope text-[11px] font-semibold text-[#b7791f]">
            <GiftGlyph />
            {t("Gifted")}
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-[#edf3ff] px-2.5 py-0.5 font-manrope text-[11px] font-semibold text-navy">
            {t("My Own")}
          </span>
        )}
      </div>
      <h3 className="mt-1 break-all font-manrope text-[14px] font-semibold leading-5 text-[#1a1a1a]">
        {t("Certificate ID")}: <strong className="font-bold">{certificate.certificateNo}</strong>
      </h3>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link
          href={`${routes.certificates}/${encodeURIComponent(certificate.orderId)}`}
          className="flex h-10 cursor-pointer items-center justify-center rounded-[10px] bg-navy px-2 font-manrope text-[13px] font-medium text-white transition-colors hover:bg-navy-deep"
        >
          {t("View →")}
        </Link>
        <button
          type="button"
          onClick={download}
          disabled={downloading}
          aria-busy={downloading}
          className="inline-flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-[10px] border border-[#e6ebf0] bg-[#f7f9fc] px-2 font-manrope text-[13px] font-medium text-navy transition-colors hover:bg-[#eef2f7] disabled:cursor-wait disabled:opacity-60"
        >
          <DownloadGlyph />
          <span className="truncate">{downloading ? t("Downloading...") : t("Download")}</span>
        </button>
      </div>
      {failed ? <CertificateDownloadFailedDialog onRetry={download} onClose={() => setFailed(false)} /> : null}
    </article>
  );
}
