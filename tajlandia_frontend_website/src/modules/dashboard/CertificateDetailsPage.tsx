"use client";

import Link from "next/link";
import { useState } from "react";
import { DashboardNavbar } from "./DashboardNavbar";
import { useAuth } from "@/lib/hooks/useAuth";
import { routes } from "@/lib/constants/routes";
import { useDashboardLanguage } from "./DashboardLanguageContext";

type Dialog = "download" | "share" | null;

export function CertificateDetailsPage({ certificateId }: { certificateId: string }) {
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useDashboardLanguage();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [copied, setCopied] = useState(false);
  const certificateUrl =
    typeof window === "undefined"
      ? `/dashboard/certificates/${certificateId}`
      : `${window.location.origin}/dashboard/certificates/${certificateId}`;
  const pdfUrl = `/api/certificates/${certificateId}`;

  if (isLoading)
    return (
      <main className="flex min-h-[100svh] items-center justify-center bg-[#f5f9fc] text-sm text-muted">
        {t("Loading certificate...")}
      </main>
    );
  if (!isAuthenticated) return null;

  function downloadCertificate() {
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = `${certificateId}-certificate.pdf`;
    link.click();
    setDialog("download");
  }

  async function copyLink() {
    await navigator.clipboard.writeText(certificateUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  }

  async function shareLink() {
    if (navigator.share) {
      await navigator.share({ title: "Tajlandia Certificate", url: certificateUrl });
      return;
    }
    await copyLink();
  }

  return (
    <div className="min-h-[100svh] bg-[#f5f9fc] text-navy">
      <DashboardNavbar active="none" />
      <main className="mx-auto w-[92%] max-w-none px-5 pb-12 pt-10 sm:px-8 sm:pt-14">
        <Link href={routes.certificates} className="text-[11px] font-medium text-navy">
          ← Back to My Certificates
        </Link>
        <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <h1 className="text-[28px] font-semibold tracking-[-0.04em] text-[#171717] sm:text-[32px]">
              Get your Certificate
            </h1>
            <p className="mt-1 text-[12px] text-[#7b858f]">
              Your certificate is ready. Download it and keep your ownership record safe.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={downloadCertificate}
              className="inline-flex h-10 items-center gap-2 rounded-[8px] bg-navy px-5 text-[11px] text-white"
            >
              Download <span aria-hidden="true">⇩</span>
            </button>
            <button
              type="button"
              aria-label="Share certificate"
              onClick={() => setDialog("share")}
              className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-white text-navy shadow-[0_4px_14px_rgba(11,31,77,0.08)]"
            >
              <img
                src="/images/dashboard/certificate-share.png"
                alt=""
                className="h-6 w-6 object-contain"
              />
            </button>
          </div>
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_305px]">
          <div className="flex justify-center bg-white p-3 shadow-[0_5px_18px_rgba(11,31,77,0.06)] sm:p-5">
            <img
              src="/images/dashboard/certificate.png"
              alt="Certificate of ownership"
              className="h-auto max-h-[720px] w-full max-w-[520px] object-contain"
            />
          </div>
          <aside className="space-y-4">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-navy">
                ◉ Public registry view
              </p>
              <h2 className="mt-2 text-[17px] font-semibold text-navy">
                Verified Public Record
              </h2>
              <p className="mt-1 text-[10px] leading-4 text-[#8f99a4]">
                Authorized for third-party audit. Personal financial data, telephone, and
                residential records remain redacted.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-[8px] bg-[#eaf0f5] px-3 py-2 text-[9px] text-[#7b858f]">
              <span className="min-w-0 flex-1 truncate">{certificateUrl}</span>
              <button
                type="button"
                onClick={copyLink}
                className="rounded-[6px] bg-navy px-3 py-1.5 text-[10px] text-white"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="rounded-[12px] bg-white p-4 shadow-[0_5px_18px_rgba(11,31,77,0.06)]">
              <h3 className="text-[11px] font-semibold text-navy">
                ◉ Certificate Verified
              </h3>
              <p className="mt-1 text-[9px] text-[#8f99a4]">
                Anchor Timestamp: 26 Aug 2026, 16:42 UTC · Ledger Block #48102
              </p>
              <div className="my-4 border-t border-[#e8edf1]" />
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-[9px]">
                <Detail label="Certificate ID" value={certificateId} />
                <Detail label="Registered Owner" value="R. Cruston (Verified)" />
                <Detail label="Location" value="Phuket, Thailand" />
                <Detail label="Total Area" value="100 Rai" accent />
                <Detail label="Plots Count" value="4 Verified Plots" />
                <Detail label="Issuing Authority" value="Tajlandia Cadastal SPV" />
                <Detail label="Issue Date" value="26 August 2026" />
                <Detail label="Total Paid" value="$25.10" accent />
              </div>
            </div>
          </aside>
        </div>
      </main>
      {dialog === "download" ? (
        <DownloadDialog
          onClose={() => setDialog(null)}
          onView={() => window.open(pdfUrl, "_blank", "noopener,noreferrer")}
        />
      ) : null}
      {dialog === "share" ? (
        <ShareDialog
          certificateUrl={certificateUrl}
          copied={copied}
          onCopy={copyLink}
          onShare={shareLink}
          onClose={() => setDialog(null)}
        />
      ) : null}
    </div>
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
    <div>
      <p className="text-[8px] uppercase tracking-[0.06em] text-[#a0aab4]">{label}</p>
      <p className={`mt-1 font-medium ${accent ? "text-brand-red" : "text-navy"}`}>
        {value}
      </p>
    </div>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#071536]/40 px-4 backdrop-blur-[1px]">
      <section
        role="dialog"
        aria-modal="true"
        className="w-full max-w-[340px] rounded-[14px] bg-white p-6 text-center shadow-[0_20px_60px_rgba(11,31,77,0.24)]"
      >
        {children}
      </section>
    </div>
  );
}

function DownloadDialog({
  onClose,
  onView,
}: {
  onClose: () => void;
  onView: () => void;
}) {
  return (
    <Overlay>
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#edf4ff] text-2xl text-navy">
        ⇩
      </div>
      <h2 className="mt-4 text-[16px] font-semibold text-[#171717]">
        Certificate Downloaded
      </h2>
      <p className="mt-1 text-[10px] leading-4 text-[#8f99a4]">
        Your certificate has been downloaded successfully. You can view it anytime.
      </p>
      <button
        type="button"
        onClick={() => {
          onClose();
          onView();
        }}
        className="mt-5 h-10 w-full rounded-[8px] bg-navy text-[11px] text-white"
      >
        View →
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
  return (
    <Overlay>
      <div className="flex justify-end">
        <button
          type="button"
          aria-label="Close share dialog"
          onClick={onClose}
          className="text-[18px] leading-none text-[#b5bdc5]"
        >
          ×
        </button>
      </div>
      <img
        src="/images/brand/tajlandia-logo.png"
        alt="Tajlandia"
        className="mx-auto mt-1 h-auto w-[94px] object-contain"
      />
      <h2 className="mt-5 text-[17px] font-semibold text-[#171717]">
        Share your Certificate
      </h2>
      <p className="mt-1 text-[10px] leading-4 text-[#8f99a4]">
        Share your verified Tajlandia ownership record with colleagues, banks, or legal
        counsel.
      </p>
      <div className="mt-4 rounded-[8px] bg-[#f2f5f8] px-3 py-2 text-left text-[9px] text-[#7b858f] break-all">
        {certificateUrl}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onCopy}
          className="rounded-[8px] border border-[#e1e7ec] py-2.5 text-[10px] text-navy"
        >
          {copied ? "Copied" : "Copy link"}
        </button>
        <button
          type="button"
          onClick={onShare}
          className="rounded-[8px] bg-navy py-2.5 text-[10px] text-white"
        >
          ↗ Share Link
        </button>
      </div>
    </Overlay>
  );
}
