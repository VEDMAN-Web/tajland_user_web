"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AccountMenu } from "./AccountMenu";
import { DashboardNavbar } from "./DashboardNavbar";
import { useAuth } from "@/lib/hooks/useAuth";
import { routes } from "@/lib/constants/routes";

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

export function HelpSupportPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [openFaq, setOpenFaq] = useState(0);
  const [message, setMessage] = useState("");
  const [hasInteracted, setHasInteracted] = useState(false);
  const [sent, setSent] = useState(false);
  const count = wordCount(message);
  const hasEnoughWords = count >= 20;

  if (isLoading) return <main className="flex min-h-[100svh] items-center justify-center bg-[#f7fafc] text-sm text-muted">Loading support...</main>;
  if (!isAuthenticated) {
    router.replace(routes.login);
    return null;
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setHasInteracted(true);
    if (!hasEnoughWords) return;
    setSent(true);
  }

  return (
    <div className="min-h-[100svh] bg-[#f7fafc] text-navy">
      <DashboardNavbar active="home" />
      <main className="mx-auto grid w-[92%] max-w-none gap-8 px-5 pb-12 pt-10 sm:px-8 lg:grid-cols-[256px_minmax(0,1fr)] lg:gap-7 lg:pt-14">
        <AccountMenu active="help" />

        <section className="min-w-0">
          <div className="border-b border-[#e1e8ed] pb-4">
            <h1 className="text-[30px] font-semibold tracking-[-0.04em] text-navy sm:text-[32px]">Help &amp; Support</h1>
            <p className="mt-1 text-[12px] text-[#7b858f]">Need help? We&apos;re here for you.</p>
          </div>

          <div className="mt-5 space-y-2">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={faq.question + index} className={`overflow-hidden rounded-[10px] bg-white shadow-[0_5px_18px_rgba(11,31,77,0.07)] ${isOpen ? "border-l-2 border-brand-red" : "border-l-2 border-transparent"}`}>
                  <button type="button" aria-expanded={isOpen} onClick={() => setOpenFaq(isOpen ? -1 : index)} className="flex min-h-14 w-full items-center justify-between gap-4 px-3.5 py-3 text-left text-[11px] font-semibold text-navy sm:px-4">
                    <span>{faq.question}</span>
                    <span aria-hidden="true" className={`text-[16px] font-normal transition-transform ${isOpen ? "rotate-180" : ""}`}>⌄</span>
                  </button>
                  {isOpen ? <p className="border-t border-[#edf0f3] px-3.5 py-2.5 text-[10px] leading-5 text-[#8b949e] sm:px-4">{faq.answer}</p> : null}
                </div>
              );
            })}
          </div>

          <form onSubmit={submit} className="mt-5">
            <label htmlFor="support-message" className="text-[12px] font-medium text-navy">Other</label>
            <textarea id="support-message" value={message} onChange={(event) => { setMessage(event.target.value); setHasInteracted(true); setSent(false); }} placeholder="Send your Queries..." className="mt-1.5 h-[76px] w-full resize-none rounded-[10px] border border-[#e3e8ed] bg-white px-3 py-3 text-[10px] text-[#242b32] outline-none placeholder:text-[#c6cbd0] focus:border-[#9aaabd] focus:ring-1 focus:ring-[#d9e1e8]" aria-describedby="support-message-help" />
            <div className="mt-1.5 flex items-center justify-between gap-3">
              <p id="support-message-help" className={`text-[10px] ${hasInteracted && !hasEnoughWords ? "text-[#c81e1e]" : "text-[#9aa3ad]"}`}>
                {hasInteracted && !hasEnoughWords ? `Please enter at least 20 words. Current count: ${count}.` : `${count}/20 words`}
              </p>
              {sent ? <p role="status" className="text-[10px] text-[#198b55]">Message sent successfully.</p> : null}
            </div>
            <div className="mt-4 flex flex-col items-start justify-between gap-4 border-t border-[#e1e8ed] pt-4 sm:flex-row sm:items-center">
              <p className="text-[10px] text-[#b0b7be]">● All changes verified under 256-bit Cadastral Escrow protocol.</p>
              <div className="flex gap-3">
                <button type="button" onClick={() => router.back()} className="rounded-[9px] border border-[#e1e5e9] bg-white px-6 py-3 text-[12px] text-[#68727c]">Cancel</button>
                <button type="submit" disabled={!hasEnoughWords} className="rounded-[9px] bg-navy px-6 py-3 text-[12px] font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-45">Send Message →</button>
              </div>
            </div>
          </form>

          <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-[15px] bg-white px-6 py-5 shadow-[0_5px_24px_rgba(11,31,77,0.06)] sm:flex-row sm:items-center">
            <div><h2 className="text-[15px] font-semibold text-[#242b32]">Still need help? <span className="ml-1 rounded-full bg-[#edf3ff] px-2 py-1 text-[9px] font-medium text-navy">● Within 24 hours</span></h2><p className="mt-1 max-w-[300px] text-[10px] leading-4 text-[#8f99a4]">Our cadastral survey and registry team is standing by to resolve custom requests.</p></div>
            <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#edf3ff] text-navy">✉</span><div><p className="text-[8px] uppercase tracking-[0.08em] text-[#8f99a4]">Direct mail</p><p className="text-[11px] text-[#242b32]">support@tajlandia.com</p></div></div>
          </div>
        </section>
      </main>
    </div>
  );
}
