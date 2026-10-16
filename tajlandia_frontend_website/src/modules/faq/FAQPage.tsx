"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Container } from "@/components/ui/Container";
import { Markdown } from "@/components/ui/Markdown";
import type { FaqItem } from "./schemas/faq.schema";

type FAQPageProps = {
  /** From `GET /page/faq`, sorted; null when the request failed. */
  faqs: FaqItem[] | null;
};

export function FAQPage({ faqs }: FAQPageProps) {
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState(0);
  const [isRetrying, startRetry] = useTransition();

  return (
    <section className="bg-white pb-20 pt-12 sm:pt-16">
      <Container>
        <div className="text-center">
          <h1 className="font-[family-name:var(--font-playfair-display)] text-[56px] font-semibold leading-none tracking-[-0.04em] text-navy">
            FAQ
          </h1>
          <p className="mt-3 font-[family-name:var(--font-manrope)] text-[24px] font-normal leading-[1.35] text-[#9aa3ad]">
            Choose the way that works best for you.
          </p>
        </div>
        {!faqs ? (
          <div
            className="mx-auto mt-10 flex max-w-[420px] flex-col items-center text-center"
            role="alert"
          >
            <p className="font-[family-name:var(--font-manrope)] text-[16px] text-[#9aa3ad]">
              We couldn&apos;t load the questions right now. Please try again.
            </p>
            <button
              type="button"
              disabled={isRetrying}
              className="mt-6 h-12 min-w-[148px] rounded-full bg-navy px-8 text-[16px] font-medium leading-none text-white disabled:opacity-70"
              onClick={() => startRetry(() => router.refresh())}
            >
              {isRetrying ? "Loading..." : "Try again"}
            </button>
          </div>
        ) : faqs.length === 0 ? (
          <p className="mt-10 text-center font-[family-name:var(--font-manrope)] text-[16px] text-[#9aa3ad]">
            No questions yet. Check back soon.
          </p>
        ) : (
          <div className="mt-8 space-y-3 sm:mt-10">
            {faqs.map(({ _id, question, answer }, index) => {
              const isOpen = openFaq === index;
              return (
                <article
                  key={_id}
                  className={`overflow-hidden rounded-[12px] bg-white shadow-[0_5px_18px_rgba(11,31,77,0.07)] ${isOpen ? "border border-brand-red" : "border border-transparent"}`}
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaq(isOpen ? -1 : index)}
                    className="flex min-h-[70px] w-full items-center gap-3 px-4 py-3 text-left font-[family-name:var(--font-playfair-display)] text-[24px] font-semibold leading-[1.2] text-navy sm:px-5"
                  >
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f1f5fa] text-[12px] text-navy"
                      aria-hidden="true"
                    >
                      {isOpen ? "⌃" : "?"}
                    </span>
                    <span className="flex-1">{question}</span>
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-[20px] font-normal ${isOpen ? "bg-[#ffe8eb] text-brand-red" : "text-brand-red"}`}
                      aria-hidden="true"
                    >
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>
                  {isOpen ? (
                    <Markdown className="border-t border-[#f1f3f5] px-14 pb-5 pt-3 font-[family-name:var(--font-inter)] text-[16px] font-normal leading-[1.5] text-[#8b949e] sm:pr-14">
                      {answer}
                    </Markdown>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </Container>
    </section>
  );
}
