"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { routes } from "@/lib/constants/routes";
import { useAuth } from "@/lib/hooks/useAuth";
import { AccountMenu } from "./AccountMenu";
import { DashboardNavbar } from "./DashboardNavbar";
import { useDashboardLanguage } from "./DashboardLanguageContext";

const faqs = [
  {
    question: "Do you provide customized modular kitchens?",
    answer: "Yes. Every kitchen is custom-designed to match your space, cooking habits, and style preferences.",
  },
  {
    question: "How do I choose a place to collect?",
    answer: "Explore the map, review each destination, and contact our team when you find a place that feels right.",
  },
  {
    question: "When will I receive my certificate?",
    answer: "Your digital certificate is prepared after the collection details have been reviewed and confirmed.",
  },
  {
    question: "Can I gift a Tajlandia collection?",
    answer: "Yes. Contact support with the recipient details and our team will guide you through the gifting process.",
  },
] as const;

function wordCount(value: string) {
  return value.trim() ? value.trim().split(/\s+/).length : 0;
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={`h-4 w-4 shrink-0 text-[#66717c] transition-transform ${open ? "rotate-180" : ""}`}>
      <path d="M4 6.2 8 10.2 12 6.2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function HelpSupportPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useDashboardLanguage();
  const [openFaq, setOpenFaq] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  if (isLoading) {
    return <main className="flex min-h-[100svh] items-center justify-center bg-[#f7f9fc] text-sm text-muted">{t("Loading support...")}</main>;
  }

  if (!isAuthenticated) {
    router.replace(routes.login);
    return null;
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (wordCount(message) < 20) {
      setSent(false);
      setError("Please enter at least 20 words.");
      return;
    }

    setError("");
    setSent(true);
    setMessage("");
  }

  function cancel() {
    setMessage("");
    setError("");
    setSent(false);
  }

  return (
    <div className="min-h-[100svh] bg-[#f7f9fc] text-navy">
      <DashboardNavbar active="home" />
      <main className="mx-auto grid w-full max-w-[1180px] gap-6 px-5 pb-14 pt-8 sm:px-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start lg:gap-7">
        <AccountMenu active="help" />

        <section className="min-w-0">
          <h1 className="font-manrope text-[28px] font-semibold leading-none tracking-[-0.03em] text-navy sm:text-[32px]">
            {t("Help & Support")}
          </h1>
          <p className="font-manrope mt-2 text-[14px] leading-5 text-[#8b939e]">
            {t("Need help? We're here for you.")}
          </p>

          <div className="mt-5 grid gap-2.5">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={faq.question} className={`overflow-hidden rounded-[12px] bg-white shadow-[0_8px_28px_rgba(11,31,77,0.06)] ${isOpen ? "border-l-[3px] border-l-[#e11d2e]" : ""}`}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaq(isOpen ? -1 : index)}
                    className="flex min-h-[52px] w-full items-center justify-between gap-4 px-4 text-left"
                  >
                    <span className="font-manrope text-[14px] font-semibold leading-5 text-navy">{t(faq.question)}</span>
                    <ChevronIcon open={isOpen} />
                  </button>
                  {isOpen ? (
                    <p className="border-t border-[#eef2f6] px-4 py-3 font-manrope text-[13px] leading-5 text-[#8b939e]">
                      {t(faq.answer)}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>

          <form onSubmit={submit} className="mt-5" noValidate>
            <label htmlFor="support-message" className="font-manrope text-[14px] font-semibold leading-5 text-navy">
              {t("Other")}
            </label>
            <textarea
              id="support-message"
              value={message}
              onChange={(event) => {
                setMessage(event.target.value);
                setError("");
                setSent(false);
              }}
              placeholder={t("Send your Queries...")}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "support-message-error" : undefined}
              className={`font-manrope mt-2 h-[88px] w-full resize-none rounded-[12px] border bg-white px-4 py-3 text-[14px] leading-5 text-[#1a1a1a] outline-none placeholder:text-[#b0b7be] ${error ? "border-[#f3c3c8] bg-[#fff1f2]" : "border-[#e4e9ef] focus:border-navy"}`}
            />
            {error ? (
              <p id="support-message-error" className="font-manrope mt-1.5 text-[12px] leading-4 text-[#d52b35]">
                {t(error)}
              </p>
            ) : null}
            {sent ? (
              <p role="status" className="font-manrope mt-1.5 text-[12px] leading-4 text-[#1aae6f]">
                {t("Message sent successfully.")}
              </p>
            ) : null}

            <div className="mt-5 flex flex-col gap-4 border-t border-[#e4e9ef] pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-manrope flex items-center gap-2 text-[12px] leading-4 text-[#8b939e]">
                <Image src="/images/profile/ic_privacy.svg" alt="" width={14} height={14} className="h-3.5 w-3.5 shrink-0" />
                <span>{t("All changes verified under 256-bit Cadastral Escrow protocol.")}</span>
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={cancel}
                  className="inline-flex h-11 items-center justify-center rounded-[12px] border border-[#e4e9ef] bg-white px-5 font-manrope text-[14px] font-medium leading-none text-[#3d4650] transition hover:bg-[#f7f9fc]"
                >
                  {t("Cancel")}
                </button>
                <button
                  type="submit"
                  className="inline-flex h-11 items-center justify-center rounded-[12px] bg-navy px-5 font-manrope text-[14px] font-medium leading-none text-white transition hover:bg-navy-deep"
                >
                  {t("Send Message →")}
                </button>
              </div>
            </div>
          </form>

          <div className="mt-5 flex flex-col gap-4 rounded-[16px] bg-white px-5 py-5 shadow-[0_8px_28px_rgba(11,31,77,0.06)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="min-w-0">
              <h2 className="font-manrope flex flex-wrap items-center gap-2 text-[16px] font-semibold leading-5 text-[#1a1a1a]">
                <span>{t("Still need help?")}</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#edf3ff] px-2.5 py-1 font-manrope text-[11px] font-medium leading-none text-navy">
                  <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-navy" />
                  {t("Within 24 hours")}
                </span>
              </h2>
              <p className="font-manrope mt-2 max-w-[460px] text-[13px] leading-5 text-[#8b939e]">
                {t("Our cadastral survey and registry team is standing by to resolve custom requests.")}
              </p>
            </div>
            <a href="mailto:support@tajlandia.com" className="flex shrink-0 items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#edf3ff] text-navy">
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
                  <rect x="3.5" y="5.5" width="17" height="13" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
                  <path d="m4.5 7 7.5 6 7.5-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span>
                <span className="block font-manrope text-[11px] font-medium uppercase tracking-[0.08em] text-[#8b939e]">
                  {t("Direct mail")}
                </span>
                <span className="mt-0.5 block font-manrope text-[14px] font-medium leading-5 text-[#1a1a1a]">
                  support@tajlandia.com
                </span>
              </span>
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
