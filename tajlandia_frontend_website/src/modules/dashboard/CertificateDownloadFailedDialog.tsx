"use client";

import Link from "next/link";
import { useEffect } from "react";
import { routes } from "@/lib/constants/routes";
import { useDashboardLanguage } from "./DashboardLanguageContext";

/** Shown when a certificate download fails (My Certificates card and certificate page). */
export function CertificateDownloadFailedDialog({ onRetry, onClose }: { onRetry: () => void; onClose: () => void }) {
  const { t } = useDashboardLanguage();

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
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="certificate-download-failed-title"
        className="relative w-full max-w-[318px] rounded-[20px] bg-white px-7 pb-7 pt-7 text-center font-manrope shadow-[0_20px_60px_rgba(11,31,77,0.24)]"
      >
        <button
          type="button"
          aria-label={t("Close")}
          onClick={onClose}
          className="absolute right-5 top-5 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full text-[#9aa3ad] hover:text-navy"
        >
          <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3 w-3">
            <path d="m3.5 3.5 9 9m0-9-9 9" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
        <div className="mx-auto flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#fff1f2]">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6">
            <path
              d="M10.27 3.98a2 2 0 0 1 3.46 0l7.6 13.17A2 2 0 0 1 19.6 20.2H4.4a2 2 0 0 1-1.73-3.05z"
              fill="#e11d2e"
            />
            <path d="M12 9v4.5" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
            <circle cx="12" cy="16.6" r="1.25" fill="#fff" />
          </svg>
        </div>
        <h2 id="certificate-download-failed-title" className="mt-4 text-[18px] font-semibold leading-6 text-[#171717]">
          {t("Certificate Generation Failed")}
        </h2>
        <p className="mx-auto mt-1.5 max-w-[220px] text-[11px] leading-4 text-[#8f99a4]">
          {t("We couldn't generate your certificate right now. Please try again.")}
        </p>
        <button
          type="button"
          onClick={() => {
            onClose();
            onRetry();
          }}
          className="mt-5 h-10 w-full cursor-pointer rounded-[10px] bg-navy text-[13px] font-medium text-white hover:bg-navy-deep"
        >
          {t("Try Again")}
        </button>
        <Link
          href={routes.helpSupport}
          className="mt-2.5 flex h-10 w-full items-center justify-center rounded-[10px] border border-[#e6ebf0] bg-white text-[11px] font-medium text-[#171717] hover:bg-[#f7f9fc]"
        >
          {t("Help & Support")}
        </Link>
      </section>
    </div>
  );
}
