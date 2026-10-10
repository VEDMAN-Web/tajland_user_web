"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { isAbortError } from "@/lib/api/browser-client";
import { isApiError } from "@/lib/api/errors";
import { isAllowedRemoteImage } from "@/lib/config/remote-images";
import { routes } from "@/lib/constants/routes";
import { useAuth } from "@/lib/hooks/useAuth";
import { logError } from "@/lib/logging/logger";
import { PageLoader } from "@/components/ui/PageLoader";
import { AccountMenu } from "./AccountMenu";
import { DashboardNavbar } from "./DashboardNavbar";
import { useDashboardLanguage } from "./DashboardLanguageContext";
import type { OrderListEntry } from "./schemas/orders.schema";
import { downloadCertificate } from "./services/certificates.client";
import { getOrders } from "./services/orders.client";

// A certificate is a paid order's `certificateNo` + `certificateUrl` (no separate API).
type Certificate = {
  orderId: string;
  certificateNo: string;
  imageUrl: string | null;
  issuedAt: string;
  gifted: boolean;
};
type SortOption = "recommended" | "oldest" | "newest" | "id-asc" | "id-desc";
type CertificatesState =
  | { status: "loading" }
  | { status: "ready"; certificates: Certificate[] }
  | { status: "error" };

const certificatePreview = "/images/certificates/my-certificates.png";

const isQuietError = (error: unknown) =>
  isAbortError(error) || (isApiError(error) && error.code === "API_SESSION_EXPIRED");

function toCertificates(orders: OrderListEntry[]): Certificate[] {
  return orders.flatMap((order) =>
    order.status === "paid" && order.certificateNo
      ? [
          {
            orderId: order.id,
            certificateNo: order.certificateNo,
            imageUrl: isAllowedRemoteImage(order.certificateUrl) ? order.certificateUrl : null,
            issuedAt: order.paidAt ?? order.createdAt,
            gifted: order.purchaseType === "gift",
          },
        ]
      : [],
  );
}

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
  const certificates = useMemo(() => (state.status === "ready" ? state.certificates : []), [state]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace(routes.login);
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const controller = new AbortController();
    getOrders(controller.signal)
      .then((orders) => setState({ status: "ready", certificates: toCertificates(orders) }))
      .catch((error: unknown) => {
        if (isQuietError(error)) return;
        logError(error, "Failed to load certificates");
        setState({ status: "error" });
      });
    return () => controller.abort();
  }, [isAuthenticated, reloadKey]);

  const visibleCertificates = useMemo(() => {
    const filtered = certificates.filter((certificate) =>
      certificate.gifted ? showGifted : showMyCertificates,
    );
    return [...filtered].sort((a, b) => {
      if (sort === "oldest") return dateValue(a) - dateValue(b);
      if (sort === "newest") return dateValue(b) - dateValue(a);
      if (sort === "id-asc") return a.certificateNo.localeCompare(b.certificateNo);
      if (sort === "id-desc") return b.certificateNo.localeCompare(a.certificateNo);
      return 0;
    });
  }, [certificates, showGifted, showMyCertificates, sort]);

  if (isLoading || !isAuthenticated) return <PageLoader label={t("Loading certificates...")} />;

  const filtersActive = !showMyCertificates || !showGifted;

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
      <DashboardNavbar active="none" />
      <main className="mx-auto grid w-full max-w-[1180px] gap-6 px-5 pb-14 pt-8 sm:px-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start lg:gap-7">
        <AccountMenu active="certificates" />
        <section className="min-w-0">
          <h1 className="font-manrope text-[28px] font-semibold leading-none tracking-[-0.03em] text-navy sm:text-[32px]">
            {t("My Certificates")}
          </h1>
          <p className="mt-2 font-manrope text-[14px] leading-5 text-[#8b939e]">
            {t("View and download your land ownership certificates.")}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-manrope text-[16px] font-semibold text-navy">{t("All Certificates")}</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={openFilter}
                disabled={state.status !== "ready"}
                className={`inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[10px] border bg-white px-3 font-manrope text-[12px] font-medium disabled:cursor-not-allowed disabled:opacity-50 ${
                  filtersActive ? "border-navy text-navy" : "border-[#e4e9ef] text-[#8b939e]"
                }`}
              >
                <FilterGlyph />
                {t("Filter")}
              </button>
              <button
                type="button"
                onClick={openSort}
                disabled={state.status !== "ready"}
                className={`inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[10px] border bg-white px-3 font-manrope text-[12px] font-medium disabled:cursor-not-allowed disabled:opacity-50 ${
                  sort !== "recommended" ? "border-navy text-navy" : "border-[#e4e9ef] text-[#8b939e]"
                }`}
              >
                <SortGlyph />
                {t("Sort")}
              </button>
            </div>
          </div>
          {state.status === "loading" ? (
            <div aria-busy="true" className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <span className="sr-only" role="status">
                {t("Loading certificates...")}
              </span>
              {[0, 1, 2].map((key) => (
                <div
                  key={key}
                  aria-hidden="true"
                  className="h-[330px] animate-pulse rounded-[16px] border border-[#eef1f4] bg-white motion-reduce:animate-none"
                />
              ))}
            </div>
          ) : state.status === "error" ? (
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
          ) : visibleCertificates.length ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleCertificates.map((certificate) => (
                <CertificateCard key={certificate.orderId} certificate={certificate} />
              ))}
            </div>
          ) : (
            <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#edf4ff] text-2xl text-navy">
                ▤
              </div>
              <h2 className="mt-4 font-manrope text-[19px] font-semibold text-[#171717]">
                {certificates.length ? t("No certificates match the selected filters.") : t("No certificates available")}
              </h2>
              {certificates.length ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowMyCertificates(true);
                    setShowGifted(true);
                  }}
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
          onApply={() => {
            setSort(draftSort);
            setDialog(null);
          }}
        />
      ) : null}
      {dialog === "filter" ? (
        <FilterDialog
          found={certificates.filter((certificate) => (certificate.gifted ? draftGifted : draftMyCertificates)).length}
          myCertificates={draftMyCertificates}
          gifted={draftGifted}
          onMyCertificatesChange={setDraftMyCertificates}
          onGiftedChange={setDraftGifted}
          onClose={() => setDialog(null)}
          onReset={() => {
            setDraftMyCertificates(true);
            setDraftGifted(true);
          }}
          onApply={() => {
            setShowMyCertificates(draftMyCertificates);
            setShowGifted(draftGifted);
            setDialog(null);
          }}
        />
      ) : null}
    </div>
  );
}

function dateValue(certificate: Certificate) {
  const value = Date.parse(certificate.issuedAt);
  return Number.isNaN(value) ? 0 : value;
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
  /** Certificates the draft filter matches. */
  found: number;
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
          <span className="font-manrope text-[12px] text-[#8b939e]">{found} {t("certificates found")}</span>
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

function CertificateCard({ certificate }: { certificate: Certificate }) {
  const { t } = useDashboardLanguage();
  const router = useRouter();
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const issued = formatIssued(certificate.issuedAt);

  async function download() {
    if (downloading) return;
    setError("");
    setDownloading(true);
    const result = await downloadCertificate(certificate.orderId);
    setDownloading(false);
    if (result.ok) return;
    if (result.sessionExpired) {
      router.replace(routes.login);
      return;
    }
    setError(t(result.message));
  }

  return (
    <article className="rounded-[16px] border border-[#eef1f4] bg-white px-4 pb-4 pt-5 shadow-[0_10px_28px_rgba(11,31,77,0.06)]">
      <div className="relative mx-auto aspect-[616/898] w-[68%] max-w-[210px]">
        <Image
          src={certificate.imageUrl ?? certificatePreview}
          alt={`${t("Certificate ID")}: ${certificate.certificateNo}`}
          fill
          sizes="210px"
          className="object-contain"
        />
      </div>
      <p className="mt-4 font-manrope text-[12px] leading-4 text-[#8b939e]">
        {t("Generated on")} {issued}
      </p>
      <h3 className="mt-1 break-all font-manrope text-[14px] font-semibold leading-5 text-[#1a1a1a]">
        {t("Certificate ID")}: <strong className="font-bold">{certificate.certificateNo}</strong>
      </h3>
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <Link
          href={`${routes.certificates}/${encodeURIComponent(certificate.orderId)}`}
          className="flex h-11 cursor-pointer items-center justify-center rounded-[12px] bg-navy font-manrope text-[13px] font-medium text-white"
        >
          {t("View →")}
        </Link>
        <button
          type="button"
          onClick={download}
          disabled={downloading}
          aria-busy={downloading}
          className="inline-flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-[12px] border border-[#e6ebf0] bg-[#f7f9fc] font-manrope text-[13px] font-medium text-navy disabled:cursor-wait disabled:opacity-60"
        >
          <DownloadGlyph />
          {downloading ? t("Downloading...") : t("Download")}
        </button>
      </div>
      {error ? (
        <p role="alert" className="mt-2 font-manrope text-[12px] leading-4 text-[#e11d2e]">
          {error}
        </p>
      ) : null}
    </article>
  );
}
