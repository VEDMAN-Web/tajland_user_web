"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { certificatePreviewUrl } from "@/lib/config/remote-images";
import { useDashboardLanguage } from "./DashboardLanguageContext";

const loadingSkeleton = (
  <span aria-hidden="true" className="absolute inset-0 animate-pulse rounded-[8px] bg-[#eef1f4] motion-reduce:animate-none" />
);

// pdf.js only runs in the browser, and only loads when a PDF needs it.
const CertificatePdf = dynamic(() => import("./CertificatePdf").then((module) => module.CertificatePdf), {
  ssr: false,
  loading: () => loadingSkeleton,
});

function isPdfUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  try {
    const { protocol, pathname } = new URL(url);
    return protocol === "https:" && pathname.toLowerCase().endsWith(".pdf");
  } catch {
    return false;
  }
}

/**
 * A certificate's preview inside a `relative` box with the certificate's aspect
 * ratio. Images and Cloudinary PDFs (as a page-1 JPG) go through `next/image`;
 * PDFs hosted anywhere else are rendered in the browser with react-pdf.
 */
export function CertificatePreview({
  url,
  alt,
  sizes,
  priority = false,
}: {
  url: string | null | undefined;
  alt: string;
  sizes: string;
  priority?: boolean;
}) {
  const image = certificatePreviewUrl(url);
  const fallback = <CertificateUnavailable url={isPdfUrl(url) ? url : null} />;

  if (image) {
    return <Image src={image} alt={alt} fill sizes={sizes} priority={priority} className="object-contain" />;
  }
  if (isPdfUrl(url)) {
    return <CertificatePdf url={url} alt={alt} loading={loadingSkeleton} fallback={fallback} />;
  }
  return fallback;
}

function CertificateUnavailable({ url }: { url: string | null }) {
  const { t } = useDashboardLanguage();
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-[8px] border border-dashed border-[#dfe5ec] bg-[#f7f9fc] px-3 text-center">
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-8 w-8 text-[#9aa3ad]">
        <path
          d="M7 3.5h6.5L18 8v12.5H7zM13.5 3.5V8H18M9.5 12.5h6M9.5 15.5h6M9.5 18.5h3.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </svg>
      <p className="font-manrope text-[12px] leading-4 text-[#8b939e]">{t("Certificate preview unavailable")}</p>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-manrope text-[12px] font-medium text-navy underline underline-offset-4"
        >
          {t("Open PDF")}
        </a>
      ) : null}
    </div>
  );
}
