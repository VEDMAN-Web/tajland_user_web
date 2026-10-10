"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAbortError } from "@/lib/api/browser-client";
import { isApiError } from "@/lib/api/errors";
import { isAllowedRemoteImage } from "@/lib/config/remote-images";
import { routes } from "@/lib/constants/routes";
import { useAuth } from "@/lib/hooks/useAuth";
import { logError } from "@/lib/logging/logger";
import { PageLoader } from "@/components/ui/PageLoader";
import { DashboardNavbar } from "./DashboardNavbar";
import { useDashboardLanguage } from "./DashboardLanguageContext";
import type { OrderDetail } from "./schemas/orders.schema";
import { downloadCertificate } from "./services/certificates.client";
import { getOrderDetail } from "./services/orders.client";

type Dialog = "download" | "share" | null;
type CertificateState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "not-found" }
  | { status: "ready"; order: OrderDetail };

const CERTIFICATE_PLACEHOLDER = "/images/dashboard/certificate.png";

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

const personName = (person: OrderDetail["buyer"]) =>
  [person?.firstName, person?.lastName].filter(Boolean).join(" ").trim();

/**
 * One certificate, i.e. a paid order (`GET /orders/{id}`): its image and the
 * ownership details printed on it. The URL id is the order id.
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
  const [downloadError, setDownloadError] = useState("");
  const [pageUrl, setPageUrl] = useState(`${routes.certificates}/${certificateId}`);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace(routes.login);
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const controller = new AbortController();
    getOrderDetail(certificateId, controller.signal)
      .then((order) => {
        setPageUrl(window.location.href);
        // Unpaid orders have no certificate yet.
        setState(order.status === "paid" && order.certificateNo ? { status: "ready", order } : { status: "not-found" });
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

  const order = state.status === "ready" ? state.order : null;
  const image = isAllowedRemoteImage(order?.certificateUrl) ? order.certificateUrl : null;

  async function download() {
    if (!order || downloading) return;
    setDownloadError("");
    setDownloading(true);
    const result = await downloadCertificate(order.id);
    setDownloading(false);
    if (result.ok) {
      setDialog("download");
      return;
    }
    if (result.sessionExpired) {
      router.replace(routes.login);
      return;
    }
    setDownloadError(t(result.message));
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
        <Link href={routes.certificates} className="cursor-pointer font-manrope text-[11px] font-medium text-navy">
          ← {t("Back to My Certificates")}
        </Link>
        <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <h1 className="font-manrope text-[28px] font-semibold tracking-[-0.04em] text-[#171717] sm:text-[32px]">
              {t("Get your Certificate")}
            </h1>
            <p className="mt-1 font-manrope text-[12px] text-[#7b858f]">
              {t("Your certificate is ready. Download it and keep your ownership record safe.")}
            </p>
          </div>
          {order ? (
            <div className="flex flex-col items-start gap-1.5 sm:items-end">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={download}
                  disabled={downloading}
                  aria-busy={downloading}
                  className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-[8px] bg-navy px-5 font-manrope text-[11px] text-white disabled:cursor-wait disabled:opacity-70"
                >
                  {downloading ? t("Downloading...") : t("Download")} <span aria-hidden="true">⇩</span>
                </button>
                <button
                  type="button"
                  aria-label={t("Share certificate")}
                  onClick={() => setDialog("share")}
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-[8px] bg-white text-navy shadow-[0_4px_14px_rgba(11,31,77,0.08)]"
                >
                  <Image src="/images/dashboard/certificate-share.png" alt="" width={24} height={24} className="h-6 w-6 object-contain" />
                </button>
              </div>
              {downloadError ? (
                <p role="alert" className="font-manrope text-[12px] text-[#e11d2e]">
                  {downloadError}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        {state.status === "loading" ? (
          <div aria-busy="true" className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_305px]">
            <span className="sr-only" role="status">
              {t("Loading certificate...")}
            </span>
            <span aria-hidden="true" className="block h-[520px] animate-pulse bg-white motion-reduce:animate-none" />
            <span aria-hidden="true" className="block h-[360px] animate-pulse rounded-[12px] bg-white motion-reduce:animate-none" />
          </div>
        ) : order ? (
          <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_305px]">
            <div className="flex justify-center bg-white p-3 shadow-[0_5px_18px_rgba(11,31,77,0.06)] sm:p-5">
              <div className="relative aspect-[646/941] w-full max-w-[520px]">
                <Image
                  src={image ?? CERTIFICATE_PLACEHOLDER}
                  alt={t("Certificate of ownership")}
                  fill
                  sizes="(min-width: 1024px) 520px, 92vw"
                  className="object-contain"
                  priority
                />
              </div>
            </div>
            <CertificateFacts order={order} pageUrl={pageUrl} copied={copied} onCopy={copyLink} />
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
      {dialog === "download" && order ? (
        <DownloadDialog
          onClose={() => setDialog(null)}
          onView={() => window.open(image ?? CERTIFICATE_PLACEHOLDER, "_blank", "noopener,noreferrer")}
        />
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
  order,
  pageUrl,
  copied,
  onCopy,
}: {
  order: OrderDetail;
  pageUrl: string;
  copied: boolean;
  onCopy: () => void;
}) {
  const { t } = useDashboardLanguage();
  // A gift is registered to its recipient.
  const owner = personName(order.purchaseType === "gift" ? order.recipient : order.buyer) || "—";
  const regions = [...new Set(order.items.map((item) => item.region?.name?.trim()).filter(Boolean))];
  const location = regions.length ? `${regions.join(", ")}, ${t("Thailand")}` : t("Thailand");
  const plots = `${order.totalPlots} ${t(order.totalPlots === 1 ? "Verified Plot" : "Verified Plots")}`;

  return (
    <aside className="min-w-0 space-y-4">
      <div>
        <p className="font-manrope text-[9px] font-semibold uppercase tracking-[0.08em] text-navy">
          ◉ {t("Public registry view")}
        </p>
        <h2 className="mt-2 font-manrope text-[17px] font-semibold text-navy">{t("Verified Public Record")}</h2>
        <p className="mt-1 font-manrope text-[10px] leading-4 text-[#8f99a4]">
          {t("Authorized for third-party audit. Personal financial data, telephone, and residential records remain redacted.")}
        </p>
      </div>
      <div className="flex items-center gap-2 rounded-[8px] bg-[#eaf0f5] px-3 py-2 font-manrope text-[9px] text-[#7b858f]">
        <span className="min-w-0 flex-1 truncate">{pageUrl}</span>
        <button type="button" onClick={onCopy} className="cursor-pointer rounded-[6px] bg-navy px-3 py-1.5 text-[10px] text-white">
          {copied ? t("Copied") : t("Copy")}
        </button>
      </div>
      <div className="rounded-[12px] bg-white p-4 shadow-[0_5px_18px_rgba(11,31,77,0.06)]">
        <h3 className="font-manrope text-[11px] font-semibold text-navy">◉ {t("Certificate Verified")}</h3>
        <p className="mt-1 font-manrope text-[9px] text-[#8f99a4]">
          {t("Issued")}: {formatDate(order.paidAt, true)}
        </p>
        <div className="my-4 border-t border-[#e8edf1]" />
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 font-manrope text-[9px]">
          <Detail label={t("Certificate ID")} value={order.certificateNo ?? "—"} />
          <Detail label={t("Registered Owner")} value={owner} />
          <Detail label={t("Location")} value={location} />
          <Detail label={t("Total Area")} value={`${order.totalRai.toLocaleString("en-US", { maximumFractionDigits: 2 })} ${t("Rai")}`} accent />
          <Detail label={t("Plots Count")} value={plots} />
          <Detail label={t("Issuing Authority")} value="Tajlandia Cadastral SPV" />
          <Detail label={t("Issue Date")} value={formatDate(order.paidAt)} />
          <Detail label={t("Total Paid")} value={formatMoney(order.total, order.currency)} accent />
        </div>
      </div>
    </aside>
  );
}

function Detail({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[8px] uppercase tracking-[0.06em] text-[#a0aab4]">{label}</p>
      <p className={`mt-1 break-words font-medium ${accent ? "text-brand-red" : "text-navy"}`}>{value}</p>
    </div>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#071536]/40 px-4 backdrop-blur-[1px]">
      <section
        role="dialog"
        aria-modal="true"
        className="w-full max-w-[340px] rounded-[14px] bg-white p-6 text-center font-manrope shadow-[0_20px_60px_rgba(11,31,77,0.24)]"
      >
        {children}
      </section>
    </div>
  );
}

function DownloadDialog({ onClose, onView }: { onClose: () => void; onView: () => void }) {
  const { t } = useDashboardLanguage();
  return (
    <Overlay>
      <div className="flex justify-end">
        <button type="button" aria-label={t("Close")} onClick={onClose} className="cursor-pointer text-[18px] leading-none text-[#b5bdc5]">
          ×
        </button>
      </div>
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#edf4ff] text-2xl text-navy">⇩</div>
      <h2 className="mt-4 text-[16px] font-semibold text-[#171717]">{t("Certificate Downloaded")}</h2>
      <p className="mt-1 text-[10px] leading-4 text-[#8f99a4]">
        {t("Your certificate has been downloaded successfully. You can view it anytime.")}
      </p>
      <button
        type="button"
        onClick={() => {
          onClose();
          onView();
        }}
        className="mt-5 h-10 w-full cursor-pointer rounded-[8px] bg-navy text-[11px] text-white"
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
    <Overlay>
      <div className="flex justify-end">
        <button type="button" aria-label={t("Close")} onClick={onClose} className="cursor-pointer text-[18px] leading-none text-[#b5bdc5]">
          ×
        </button>
      </div>
      <Image
        src="/images/brand/tajlandia-logo.png"
        alt="Tajlandia"
        width={94}
        height={40}
        className="mx-auto mt-1 h-auto w-[94px] object-contain"
      />
      <h2 className="mt-5 text-[17px] font-semibold text-[#171717]">{t("Share your Certificate")}</h2>
      <p className="mt-1 text-[10px] leading-4 text-[#8f99a4]">
        {t("Share your verified Tajlandia ownership record with colleagues, banks, or legal counsel.")}
      </p>
      <div className="mt-4 break-all rounded-[8px] bg-[#f2f5f8] px-3 py-2 text-left text-[9px] text-[#7b858f]">
        {certificateUrl}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" onClick={onCopy} className="cursor-pointer rounded-[8px] border border-[#e1e7ec] py-2.5 text-[10px] text-navy">
          {copied ? t("Copied") : t("Copy link")}
        </button>
        <button type="button" onClick={onShare} className="cursor-pointer rounded-[8px] bg-navy py-2.5 text-[10px] text-white">
          ↗ {t("Share Link")}
        </button>
      </div>
    </Overlay>
  );
}
