"use client";

import { useState } from "react";
import { Container } from "@/components/ui/Container";

const faqs = [
  [
    "Is this real Thai land?",
    "Yes, it represents a verified digital deed to a specific parcel of land in Thailand. While physical ownership laws for foreign nationals apply, our platform provides a legally structured digital claim backed by verified local trusts.",
  ],
  [
    "What do I actually get?",
    "You receive a verified digital certificate representing your selected symbolic fragment of Thailand, along with its registry details.",
  ],
  [
    "How much does it cost?",
    "Each location has its own price based on availability and parcel type. The current price is shown before you confirm your selection.",
  ],
  [
    "Is this legal ownership?",
    "Your certificate records your verified symbolic ownership and the associated registry information under the Tajlandia framework.",
  ],
  [
    "Can I get a certificate?",
    "Yes. Once your collection is confirmed, your digital certificate is generated and available from My Certificates.",
  ],
  [
    "Can I choose a specific location?",
    "Yes. Explore the map and select an available location that feels meaningful to you.",
  ],
  [
    "What happens after I claim it?",
    "Your selection is recorded, verified, and added to your collection so you can access its certificate and registry details.",
  ],
  [
    "Can I claim multiple regions?",
    "Yes. You can collect symbolic fragments from multiple regions across Thailand in the same account.",
  ],
] as const;

export function FAQPage() {
  const [openFaq, setOpenFaq] = useState(0);

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
        <div className="mt-8 space-y-3 sm:mt-10">
          {faqs.map(([question, answer], index) => {
            const isOpen = openFaq === index;
            return (
              <article
                key={question}
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
                  <p className="border-t border-[#f1f3f5] px-14 pb-5 pt-3 font-[family-name:var(--font-inter)] text-[16px] font-normal leading-[1.5] text-[#8b949e] sm:pr-14">
                    {answer}
                  </p>
                ) : null}
              </article>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
