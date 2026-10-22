"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAbortError } from "@/lib/api/browser-client";
import { isApiError } from "@/lib/api/errors";
import { routes } from "@/lib/constants/routes";
import { useAuth } from "@/lib/hooks/useAuth";
import { logError } from "@/lib/logging/logger";
import { BackLink } from "@/components/ui/BackLink";
import { PageLoader } from "@/components/ui/PageLoader";
import { CertificateDownloadFailedDialog } from "./CertificateDownloadFailedDialog";
import { CertificatePreview } from "./CertificatePreview";
import { DashboardNavbar } from "./DashboardNavbar";
import { useDashboardLanguage } from "./DashboardLanguageContext";
import type { CertificateDetail } from "./schemas/certificates.schema";
import type { OrderDetail } from "./schemas/orders.schema";
import { downloadCertificate, getCertificate } from "./services/certificates.client";
import { getOrderDetail } from "./services/orders.client";

type Dialog = "download" | "download-failed" | "share" | null;
type CertificateState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "not-found" }
  | { status: "ready"; certificate: CertificateDetail; owner: string; plotLocations: PlotLocation[] };
type PlotLocation = { key: string; label: string; rai: number | null };

const isQuietError = (error: unknown) =>
  isAbortError(error) || (isApiError(error) && error.code === "API_SESSION_EXPIRED");

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function formatDate(value: string | null | undefined, withTime = false) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const day = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: withTime ? "short" : "long", year: "numeric" }).format(date);
  if (!withTime) return day;
  const time = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }).format(date);
  return `${day}, ${time} UTC`;
}

// The certificate API has no currency; orders are charged in USD.
const CERTIFICATE_CURRENCY = "USD";

const personName = (person: OrderDetail["recipient"]) =>
  [person?.firstName, person?.lastName].filter(Boolean).join(" ").trim();

/**
 * The certificate API has neither the gift recipient (`userName` is always the
 * buyer) nor each plot's region and size, so those come from the order. Without
 * the order, the buyer and the certificate's combined location are shown.
 */
function certificateFacts(certificate: CertificateDetail, order: OrderDetail | null) {
  const owner =
    (certificate.purchaseType === "GIFT" ? personName(order?.recipient) : personName(order?.buyer)) ||
    certificate.userName;
  const plotLocations: PlotLocation[] = order?.items.length
    ? order.items.map((item, index) => {
        const region = item.region?.name?.trim();
        return {
          key: `${item.plotId}-${index}`,
          label: region ? `${region}, Thailand` : "Thailand",
          rai: item.rai,
        };
      })
    : [{ key: "location", label: certificate.location || "Thailand", rai: null }];
  return { owner, plotLocations };
}

/**
 * One certificate (`GET /certificates/{orderId}`): its image and the ownership
 * details printed on it. The URL id is the order id.
 */
export function CertificateDetailsPage({ certificateId }: { certificateId: string }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useDashboardLanguage();
  const [state, setState] = useState<CertificateState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [pageUrl, setPageUrl] = useState(`${routes.certificates}/${certificateId}`);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace(routes.login);
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const controller = new AbortController();
    Promise.all([
      getCertificate(certificateId, controller.signal),
      // Optional: only adds the recipient and per-plot locations.
      getOrderDetail(certificateId, controller.signal).catch((error: unknown) => {
        if (isAbortError(error)) throw error;
        return null;
      }),
    ])
      .then(([certificate, order]) => {
        setPageUrl(window.location.href);
        setState({ status: "ready", certificate, ...certificateFacts(certificate, order) });
      })
      .catch((error: unknown) => {
        if (isQuietError(error)) return;
        if (isApiError(error) && (error.status === 400 || error.status === 404)) {
          setState({ status: "not-found" });
          return;
        }
        logError(error, "Failed to load certificate");
        setState({ status: "error" });
      });
    return () => controller.abort();
  }, [isAuthenticated, certificateId, reloadKey]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2200);
    return () => window.clearTimeout(timer);
  }, [copied]);

  if (isLoading || !isAuthenticated) return <PageLoader label={t("Loading certificate...")} />;

  const certificate = state.status === "ready" ? state.certificate : null;

  async function download() {
    if (!certificate || downloading) return;
    setDownloading(true);
    const result = await downloadCertificate(certificate.orderId);
    setDownloading(false);
    if (result.ok) {
      setDialog("download");
      return;
    }
    if (result.sessionExpired) {
      router.replace(routes.login);
      return;
    }
    setDialog("download-failed");
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
    } catch {
      // Clipboard blocked: the link stays visible to copy by hand.
    }
  }

  async function shareLink() {
    try {
      if (navigator.share) {
        await navigator.share({ title: t("Tajlandia Certificate"), url: pageUrl });
        return;
      }
      await copyLink();
    } catch {
      // Share sheet dismissed.
    }
  }

  return (
    <div className="min-h-[100svh] bg-[#f5f9fc] text-navy">
      <DashboardNavbar active="none" />
      <main className="mx-auto w-[92%] max-w-none px-5 pb-12 pt-10 sm:px-8 sm:pt-14">
        <BackLink href={routes.certificates}>{t("Back to My Certificates")}</BackLink>
        <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <h1 className="font-manrope text-[28px] font-semibold tracking-[-0.04em] text-[#171717] sm:text-[32px]">
              {t("Get your Certificate")}
            </h1>
            <p className="mt-1 font-manrope text-[12px] text-[#7b858f]">
              {t("Your certificate is ready. Download it and keep your ownership record safe.")}
            </p>
          </div>
          {certificate ? (
            <div className="flex flex-col items-start gap-1.5 sm:items-end">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={download}
                  disabled={downloading}
                  aria-busy={downloading}
                  className="inline-flex h-11 cursor-pointer items-center gap-2.5 rounded-[10px] bg-navy px-5 font-manrope text-[14px] font-medium text-white disabled:cursor-wait disabled:opacity-70"
                >
                  {downloading ? t("Downloading...") : t("Download")}
                  <DownloadIcon />
                </button>
                <button
                  type="button"
                  aria-label={t("Share certificate")}
                  onClick={() => setDialog("share")}
                  className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-[10px] border border-[#e5e9f0] bg-white text-navy transition-colors hover:bg-[#f5f7fa]"
                >
                  <ShareIcon />
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {state.status === "loading" ? (
          <div aria-busy="true" className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[560px_minmax(0,1fr)] lg:gap-8">
            <span className="sr-only" role="status">
              {t("Loading certificate...")}
            </span>
            <span aria-hidden="true" className="mx-auto block h-[520px] w-full max-w-[560px] animate-pulse bg-white motion-reduce:animate-none" />
            <span aria-hidden="true" className="block h-[360px] animate-pulse rounded-[12px] bg-white motion-reduce:animate-none" />
          </div>
        ) : state.status === "ready" ? (
          <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[560px_minmax(0,1fr)] lg:gap-8">
            <div className="mx-auto flex w-full max-w-[560px] justify-center self-start bg-white p-3 shadow-[0_5px_18px_rgba(11,31,77,0.06)] sm:p-5">
              <div className="relative aspect-[646/941] w-full max-w-[520px]">
                <CertificatePreview
                  url={state.certificate.certificateUrl}
                  alt={t("Certificate of ownership")}
                  sizes="(min-width: 1024px) 520px, 92vw"
                  priority
                />
              </div>
            </div>
            <CertificateFacts
              certificate={state.certificate}
              owner={state.owner}
              plotLocations={state.plotLocations}
              pageUrl={pageUrl}
              copied={copied}
              onCopy={copyLink}
            />
          </div>
        ) : (
          <div role="alert" className="mt-6 rounded-[16px] bg-white px-6 py-12 text-center shadow-[0_5px_18px_rgba(11,31,77,0.06)]">
            <p className="font-manrope text-[15px] font-semibold text-[#1a1a1a]">
              {state.status === "not-found" ? t("Certificate not found") : t("We couldn't load this certificate.")}
            </p>
            <p className="mt-1 font-manrope text-[13px] text-[#8b939e]">
              {state.status === "not-found"
                ? t("This certificate doesn't exist or isn't ready yet.")
                : t("Please check your connection and try again.")}
            </p>
            {state.status === "error" ? (
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
            ) : (
              <Link
                href={routes.certificates}
                className="mt-4 inline-flex h-11 cursor-pointer items-center rounded-[12px] bg-navy px-5 font-manrope text-[13px] font-medium text-white"
              >
                {t("Back to My Certificates")}
              </Link>
            )}
          </div>
        )}
      </main>
      {dialog === "download" && certificate ? (
        <DownloadDialog
          onClose={() => setDialog(null)}
          onView={() => {
            if (certificate.certificateUrl) window.open(certificate.certificateUrl, "_blank", "noopener,noreferrer");
          }}
        />
      ) : null}
      {dialog === "download-failed" ? (
        <CertificateDownloadFailedDialog onRetry={download} onClose={() => setDialog(null)} />
      ) : null}
      {dialog === "share" ? (
        <ShareDialog
          certificateUrl={pageUrl}
          copied={copied}
          onCopy={copyLink}
          onShare={shareLink}
          onClose={() => setDialog(null)}
        />
      ) : null}
    </div>
  );
}

function CertificateFacts({
  certificate,
  owner,
  plotLocations,
  pageUrl,
  copied,
  onCopy,
}: {
  certificate: CertificateDetail;
  owner: string;
  plotLocations: PlotLocation[];
  pageUrl: string;
  copied: boolean;
  onCopy: () => void;
}) {
  const { t } = useDashboardLanguage();
  const plots = `${certificate.totalPlots} ${t(certificate.totalPlots === 1 ? "Verified Plot" : "Verified Plots")}`;

  return (
    <aside className="min-w-0 space-y-5 lg:sticky lg:top-28 lg:self-start">
      <div>
        <p className="inline-flex items-center gap-1.5 rounded-full bg-[#e8f1fe] px-3 py-1.5 font-manrope text-[11px] font-semibold uppercase tracking-[0.08em] text-navy">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5 shrink-0">
            <path
              d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"
              fill="currentColor"
            />
            <path d="m9 12 2 2 4-4" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {t("Public registry view")}
        </p>
        <h2 className="mt-2 font-manrope text-[22px] font-semibold text-navy">{t("Verified Public Record")}</h2>
        <p className="mt-1 font-manrope text-[13px] leading-5 text-[#8f99a4]">
          {t("Authorized for third-party audit. Personal financial data, telephone, and residential records remain redacted.")}
        </p>
      </div>
      <div className="flex items-center gap-2 rounded-[10px] bg-[#eaf0f5] px-4 py-2.5 font-manrope text-[12px] text-[#7b858f]">
        <span className="min-w-0 flex-1 truncate">{pageUrl}</span>
        <button type="button" onClick={onCopy} className="cursor-pointer rounded-[8px] bg-navy px-4 py-2 text-[12px] text-white">
          {copied ? t("Copied") : t("Copy")}
        </button>
      </div>
      <div className="rounded-[14px] bg-white p-6 shadow-[0_5px_18px_rgba(11,31,77,0.06)]">
        <div className="flex items-center gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8f1fe] text-navy">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[22px] w-[22px]">
              <path
                d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path d="m9 12 2 2 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <div className="min-w-0">
            <h3 className="font-manrope text-[15px] font-semibold text-navy">{t("Certificate Verified")}</h3>
            <p className="mt-1 font-manrope text-[12px] text-[#8f99a4]">
              {t("Issued")}: {formatDate(certificate.createdAt, true)}
            </p>
          </div>
        </div>
        <div className="my-5 border-t border-[#e8edf1]" />
        <div className="grid grid-cols-2 gap-x-6 gap-y-5 font-manrope text-[13px]">
          <Detail label={t("Certificate ID")} value={certificate.certificateNo} />
          <Detail label={t("Registered Owner")} value={owner || "—"} />
          <Detail label={t("Total Area")} value={`${certificate.totalSizeRai.toLocaleString("en-US", { maximumFractionDigits: 2 })} ${t("Rai")}`} tone="red" />
          <Detail label={t("Plots Count")} value={plots} />
          <Detail label={t("Issuing Authority")} value={certificate.issuingAuthority} />
          <Detail label={t("Issue Date")} value={formatDate(certificate.createdAt)} />
          <Detail label={t("Total Paid")} value={formatMoney(certificate.orderTotal, CERTIFICATE_CURRENCY)} tone="green" />
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.06em] text-[#a0aab4]">{t("Purchase Type")}</p>
            {/* Same badges as the My Certificates cards. */}
            {certificate.purchaseType === "GIFT" ? (
              <span className="mt-1 inline-block rounded-full bg-[#fff7e6] px-2.5 py-0.5 text-[11px] font-semibold text-[#b7791f]">
                {t("Gifted")}
              </span>
            ) : (
              <span className="mt-1 inline-block rounded-full bg-[#edf3ff] px-2.5 py-0.5 text-[11px] font-semibold text-navy">
                {t("My Own")}
              </span>
            )}
          </div>
        </div>
        <div className="my-5 border-t border-[#e8edf1]" />
        <p className="font-manrope text-[10px] uppercase tracking-[0.06em] text-[#a0aab4]">{t("Location")}</p>
        <ul className="mt-3 grid gap-2 font-manrope sm:grid-cols-2">
          {plotLocations.map((plot, index) => (
            <li key={plot.key} className="flex min-w-0 items-center gap-2.5 rounded-[10px] border border-[#e8edf1] bg-white px-3 py-2.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f2f4f7] text-[10px] font-semibold text-[#7b858f]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-navy">
                {plot.label.replace(/Thailand$/, t("Thailand"))}
              </span>
              {plot.rai !== null ? (
                <span className="shrink-0 text-[12px] text-[#8f99a4]">
                  {plot.rai.toLocaleString("en-US", { maximumFractionDigits: 2 })} {t("Rai")}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

// Area in brand red, money paid in green (as in the admin panel).
const DETAIL_TONES = { default: "text-navy", red: "text-brand-red", green: "text-[#16a34a]" } as const;

function Detail({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "red" | "green";
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-[0.06em] text-[#a0aab4]">{label}</p>
      <p className={`mt-1 break-words text-[14px] font-semibold ${DETAIL_TONES[tone]}`}>{value}</p>
    </div>
  );
}

function Overlay({
  children,
  onClose,
  className = "max-w-[460px]",
}: {
  children: React.ReactNode;
  /** Backdrop click and Escape close the dialog. */
  onClose: () => void;
  className?: string;
}) {
  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#071536]/40 px-4 backdrop-blur-[2px]"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        className={`relative w-full rounded-[20px] bg-white px-8 py-8 text-center font-manrope shadow-[0_20px_60px_rgba(11,31,77,0.24)] ${className}`}
      >
        {children}
      </section>
    </div>
  );
}

function DownloadDialog({ onClose, onView }: { onClose: () => void; onView: () => void }) {
  const { t } = useDashboardLanguage();
  return (
    <Overlay onClose={onClose} className="max-w-[315px]">
      <div className="mx-auto flex h-[76px] w-[76px] items-center justify-center rounded-full bg-[#e8f1fe] text-navy">
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-8 w-8">
          <path
            d="M12 3.5v11m0 0-4.5-4.5m4.5 4.5 4.5-4.5M4 14.5v4.25c0 .97.78 1.75 1.75 1.75h12.5c.97 0 1.75-.78 1.75-1.75V14.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h2 className="mt-4 text-[20px] font-semibold leading-7 text-[#171717]">{t("Certificate Downloaded")}</h2>
      <p className="mt-1.5 text-[12px] leading-[18px] text-[#8f99a4]">
        {t("Your certificate has been downloaded successfully. You can view it anytime.")}
      </p>
      <button
        type="button"
        onClick={() => {
          onClose();
          onView();
        }}
        className="mt-6 h-12 w-full cursor-pointer rounded-[12px] bg-navy text-[14px] font-medium text-white hover:bg-navy-deep"
      >
        {t("View →")}
      </button>
    </Overlay>
  );
}

function ShareDialog({
  certificateUrl,
  copied,
  onCopy,
  onShare,
  onClose,
}: {
  certificateUrl: string;
  copied: boolean;
  onCopy: () => void;
  onShare: () => void;
  onClose: () => void;
}) {
  const { t } = useDashboardLanguage();
  return (
    <Overlay onClose={onClose}>
      <button
        type="button"
        aria-label={t("Close")}
        onClick={onClose}
        className="absolute right-6 top-6 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-[#9aa3ad] hover:text-navy"
      >
        <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5">
          <path d="m3.5 3.5 9 9m0-9-9 9" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>
      <Image
        src="/images/brand/tajlandia-logo.png"
        alt="Tajlandia"
        width={150}
        height={64}
        className="mx-auto mt-2 h-auto w-[112px] object-contain"
      />
      <h2 className="mt-6 text-[24px] font-semibold leading-8 text-[#171717]">{t("Share your Certificate")}</h2>
      <p className="mx-auto mt-2 max-w-[340px] text-[14px] leading-5 text-[#6b7280]">
        {t("Share your verified Tajlandia ownership record with colleagues, banks, or legal counsel.")}
      </p>
      {/* Screen-reader copy of the link, e.g. for when the clipboard is blocked. */}
      <p className="sr-only">{certificateUrl}</p>
      <div className="mt-7 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onCopy}
          className="h-12 cursor-pointer rounded-[12px] border border-[#e1e7ec] bg-white text-[14px] font-medium text-navy hover:bg-[#f7f9fc]"
        >
          {copied ? t("Copied") : t("Copy link")}
        </button>
        <button
          type="button"
          onClick={onShare}
          className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-[12px] bg-navy text-[14px] font-medium text-white hover:bg-navy-deep"
        >
          <svg viewBox="0 0 16 16" aria-hidden="true" className="h-4 w-4">
            <circle cx="12" cy="3.5" r="2" fill="currentColor" />
            <circle cx="4" cy="8" r="2" fill="currentColor" />
            <circle cx="12" cy="12.5" r="2" fill="currentColor" />
            <path d="m5.8 7 4.4-2.5M5.8 9l4.4 2.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
          </svg>
          {t("Share Link")}
        </button>
      </div>
    </Overlay>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-[18px] w-[18px]">
      <path
        d="M10 3v9.5m0 0-3.5-3.5M10 12.5l3.5-3.5M3.5 13.5v1.75c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25V13.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-4 w-4">
      <circle cx="12" cy="3.5" r="1.9" fill="currentColor" />
      <circle cx="4" cy="8" r="1.9" fill="currentColor" />
      <circle cx="12" cy="12.5" r="1.9" fill="currentColor" />
      <path d="m5.6 7.1 4.8-2.7M5.6 8.9l4.8 2.7" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
