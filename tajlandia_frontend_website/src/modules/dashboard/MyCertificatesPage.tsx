"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AccountMenu } from "./AccountMenu";
import { DashboardNavbar } from "./DashboardNavbar";
import { useAuth } from "@/lib/hooks/useAuth";
import { routes } from "@/lib/constants/routes";
import { useDashboardLanguage } from "./DashboardLanguageContext";

type Certificate = {
  id?: string;
  title?: string;
  generatedAt?: string;
  pdfUrl?: string;
  previewUrl?: string;
  gifted?: boolean;
};
type SortOption = "recommended" | "oldest" | "newest" | "id-asc" | "id-desc";

const defaultCertificates: Certificate[] = [
  {
    id: "TJ-100293",
    generatedAt: "24 Aug 2024",
    previewUrl: "/images/dashboard/certificate-preview.png",
    pdfUrl: "/api/certificates/TJ-100293",
  },
  {
    id: "TJ-100293",
    generatedAt: "24 Aug 2024",
    previewUrl: "/images/dashboard/certificate-preview.png",
    pdfUrl: "/api/certificates/TJ-100293",
  },
  {
    id: "TJ-100293",
    generatedAt: "24 Aug 2024",
    previewUrl: "/images/dashboard/certificate-preview.png",
    pdfUrl: "/api/certificates/TJ-100293",
  },
];

function readCertificates(): Certificate[] {
  try {
    const stored = localStorage.getItem("tajlandia_certificates");
    const parsed = stored ? JSON.parse(stored) : [];
    const certificates = Array.isArray(parsed)
      ? parsed.filter((item): item is Certificate => item && typeof item === "object")
      : [];
    return certificates.length ? certificates : defaultCertificates;
  } catch {
    return defaultCertificates;
  }
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
  const [certificates] = useState<Certificate[]>(() => readCertificates());
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null);
  const [dialog, setDialog] = useState<"sort" | "filter" | null>(null);
  const [sort, setSort] = useState<SortOption>("recommended");
  const [draftSort, setDraftSort] = useState<SortOption>("recommended");
  const [showMyCertificates, setShowMyCertificates] = useState(true);
  const [showGifted, setShowGifted] = useState(true);
  const [draftMyCertificates, setDraftMyCertificates] = useState(true);
  const [draftGifted, setDraftGifted] = useState(true);

  const visibleCertificates = useMemo(() => {
    const filtered = certificates.filter((certificate) =>
      certificate.gifted ? showGifted : showMyCertificates,
    );
    return [...filtered].sort((a, b) => {
      if (sort === "oldest") return dateValue(a) - dateValue(b);
      if (sort === "newest") return dateValue(b) - dateValue(a);
      if (sort === "id-asc") return (a.id ?? "").localeCompare(b.id ?? "");
      if (sort === "id-desc") return (b.id ?? "").localeCompare(a.id ?? "");
      return 0;
    });
  }, [certificates, showGifted, showMyCertificates, sort]);

  if (isLoading)
    return (
      <main className="flex min-h-[100svh] items-center justify-center bg-white text-sm text-muted">
        {t("Loading certificates...")}
      </main>
    );
  if (!isAuthenticated) {
    router.replace(routes.login);
    return null;
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
    <div className="min-h-[100svh] bg-white text-navy">
      <DashboardNavbar active="none" />
      <main className="mx-auto grid w-[92%] max-w-none gap-8 px-5 pb-12 pt-10 sm:px-8 lg:grid-cols-[256px_minmax(0,1fr)] lg:gap-7 lg:pt-14">
        <AccountMenu active="certificates" />
        <section className="min-w-0">
          <div className="border-b border-[#e1e8ed] pb-4">
            <h1 className="text-[30px] font-semibold tracking-[-0.04em] text-[#171717] sm:text-[32px]">
              {t("My Certificates")}
            </h1>
            <p className="mt-1 text-[12px] text-[#7b858f]">
              {t("View and download your land ownership certificates.")}
            </p>
          </div>
          <div className="mt-5 flex items-center justify-between gap-3">
            <h2 className="text-[17px] font-semibold text-navy">{t("All Certificates")}</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={openFilter}
                className="inline-flex items-center gap-1 rounded-[8px] border border-[#e3e8ed] px-3 py-2 text-[10px] text-[#8f99a4]"
              >
                ☷ Filter
              </button>
              <button
                type="button"
                onClick={openSort}
                className="inline-flex items-center gap-1 rounded-[8px] border border-[#e3e8ed] px-3 py-2 text-[10px] text-[#8f99a4]"
              >
                ⇅ Sort
              </button>
            </div>
          </div>
          {visibleCertificates.length ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleCertificates.map((certificate, index) => (
                <CertificateCard
                  key={`${certificate.id ?? "certificate"}-${index}`}
                  certificate={certificate}
                />
              ))}
            </div>
          ) : (
            <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#edf4ff] text-2xl text-navy">
                ▤
              </div>
              <h2 className="mt-4 text-[19px] font-semibold text-[#171717]">
                No certificates available
              </h2>
              <p className="mt-1 max-w-[320px] text-[11px] leading-4 text-[#7b858f]">
                Certificates will appear here once a verified purchase has generated a
                real PDF certificate.
              </p>
            </div>
          )}
        </section>
      </main>
      {selectedPdf ? (
        <PdfViewer src={selectedPdf} onClose={() => setSelectedPdf(null)} />
      ) : null}
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
  const value = certificate.generatedAt ? Date.parse(certificate.generatedAt) : 0;
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
  return (
    <ModalShell>
      <div className="flex items-start gap-3 border-b border-[#edf0f3] px-5 py-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#edf3ff] text-lg text-navy">
          ⇅
        </span>
        <div className="flex-1">
          <h2 className="text-[17px] font-semibold text-navy">Sort by</h2>
          <p className="text-[10px] text-[#8b949e]">Reorder active parcel markers</p>
        </div>
        <CloseButton onClick={onClose} />
      </div>
      <div className="space-y-1 px-3 py-3">
        {sortLabels.map((option) => (
          <label
            key={option.value}
            className={`flex cursor-pointer items-center gap-3 rounded-[10px] px-3 py-3 ${value === option.value ? "bg-[#f3f7ff]" : "hover:bg-[#f8fafc]"}`}
          >
            <input
              type="radio"
              name="certificate-sort"
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="h-4 w-4 accent-[#06245f]"
            />
            <span className="flex-1 text-[13px] text-[#8b949e]">
              <strong className={value === option.value ? "text-navy" : "font-normal"}>
                {option.label}
              </strong>
              {option.detail ? (
                <small className="block text-[10px] text-[#8b949e]">
                  {option.detail}
                </small>
              ) : null}
            </span>
            {option.value === "recommended" ? (
              <span className="rounded-[4px] bg-[#eaf2ff] px-2 py-1 text-[9px] font-semibold text-navy">
                DEFAULT
              </span>
            ) : null}
          </label>
        ))}
      </div>
      <DialogActions onClose={onClose} onApply={onApply} applyLabel="Apply" />
    </ModalShell>
  );
}

function FilterDialog({
  myCertificates,
  gifted,
  onMyCertificatesChange,
  onGiftedChange,
  onClose,
  onReset,
  onApply,
}: {
  myCertificates: boolean;
  gifted: boolean;
  onMyCertificatesChange: (value: boolean) => void;
  onGiftedChange: (value: boolean) => void;
  onClose: () => void;
  onReset: () => void;
  onApply: () => void;
}) {
  return (
    <ModalShell>
      <div className="flex items-start gap-3 border-b border-[#edf0f3] px-5 py-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#eef2f5] text-lg text-navy">
          ☷
        </span>
        <div className="flex-1">
          <h2 className="text-[17px] font-semibold text-navy">Filter Plots</h2>
          <p className="text-[10px] text-[#8b949e]">
            Narrow certificates across Thailand
          </p>
        </div>
        <CloseButton onClick={onClose} />
      </div>
      <div className="px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8b949e]">
          Certificates
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <CheckOption
            label="My Certificates"
            checked={myCertificates}
            onChange={onMyCertificatesChange}
          />
          <CheckOption label="Gifted" checked={gifted} onChange={onGiftedChange} />
        </div>
      </div>
      <div className="flex items-center justify-between bg-[#f7f9fc] px-5 py-4">
        <button type="button" onClick={onReset} className="text-[12px] text-[#8b949e]">
          Clear All
        </button>
        <div className="flex items-center gap-4">
          <span className="text-[10px] text-[#8b949e]">
            {myCertificates || gifted ? "Certificates found" : "0 certificates found"}
          </span>
          <button
            type="button"
            onClick={onApply}
            className="rounded-[9px] bg-navy px-4 py-2.5 text-[12px] font-medium text-white"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </ModalShell>
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
    <label className="flex cursor-pointer items-center gap-2 rounded-[9px] border border-[#e3e8ed] px-3 py-2.5 text-[11px] text-[#8b949e]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-[#06245f]"
      />
      {label}
    </label>
  );
}

function ModalShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-end bg-transparent p-3 pt-20 sm:p-6 sm:pt-24">
      <section
        role="dialog"
        aria-modal="true"
        className="w-full max-w-[420px] overflow-hidden rounded-[14px] bg-white shadow-[0_20px_60px_rgba(11,31,77,0.22)]"
      >
        {children}
      </section>
    </div>
  );
}

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Close"
      onClick={onClick}
      className="text-xl leading-none text-[#9aa3ad]"
    >
      ×
    </button>
  );
}

function DialogActions({
  onClose,
  onApply,
  applyLabel,
}: {
  onClose: () => void;
  onApply: () => void;
  applyLabel: string;
}) {
  return (
    <div className="flex items-center justify-between bg-[#f7f9fc] px-5 py-4">
      <button type="button" onClick={onClose} className="text-[12px] text-[#8b949e]">
        Reset
      </button>
      <button
        type="button"
        onClick={onApply}
        className="rounded-[9px] bg-navy px-5 py-2.5 text-[12px] font-medium text-white"
      >
        {applyLabel}
      </button>
    </div>
  );
}

function PdfViewer({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#071536]/55 p-4 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Certificate PDF viewer"
        className="flex h-[min(90vh,800px)] w-full max-w-[920px] flex-col overflow-hidden rounded-[12px] bg-white shadow-[0_20px_60px_rgba(11,31,77,0.25)]"
      >
        <div className="flex items-center justify-between border-b border-[#e5eaf0] px-4 py-3">
          <h2 className="text-[13px] font-semibold text-navy">Certificate PDF</h2>
          <CloseButton onClick={onClose} />
        </div>
        <iframe title="Certificate PDF" src={src} className="min-h-0 flex-1" />
      </section>
    </div>
  );
}

function CertificateCard({ certificate }: { certificate: Certificate }) {
  const pdfUrl =
    certificate.pdfUrl ?? `/api/certificates/${certificate.id ?? "certificate"}`;
  return (
    <article className="rounded-[14px] bg-white p-3 shadow-[0_5px_18px_rgba(11,31,77,0.08)]">
      <div className="flex h-[145px] items-center justify-center overflow-hidden rounded-[8px] border border-[#edf0f3] bg-[#fafbfc]">
        <img
          src={certificate.previewUrl ?? "/images/dashboard/certificate-preview.png"}
          alt="Certificate preview"
          className="h-full w-full object-contain"
        />
      </div>
      <p className="mt-3 text-[10px] text-[#7b858f]">
        Generated on {certificate.generatedAt ?? "date unavailable"}
      </p>
      <h3 className="mt-1 text-[11px] font-semibold text-navy">
        Certificate ID: {certificate.id ?? "Unavailable"}
      </h3>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Link
          href={`/dashboard/certificates/${certificate.id ?? "certificate"}`}
          className="flex h-11 items-center justify-center rounded-[8px] bg-navy text-[10px] text-white"
        >
          View →
        </Link>
        <a
          href={pdfUrl}
          download
          className="flex h-11 items-center justify-center rounded-[8px] bg-[#f5f8fc] text-[10px] text-navy"
        >
          ⇩ Download
        </a>
      </div>
    </article>
  );
}
