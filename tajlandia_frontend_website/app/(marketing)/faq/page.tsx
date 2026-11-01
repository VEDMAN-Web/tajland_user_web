import type { Metadata } from "next";
import { headers } from "next/headers";
import { JsonLd } from "@/components/shared/JsonLd";
import { createFaqJsonLd } from "@/lib/seo/json-ld";
import { getPageMetadata } from "@/lib/seo/metadata";
import { FAQPage, fetchFaqs, type FaqItem } from "@/modules/faq";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata({
    title: "FAQ",
    description:
      "Answers to common questions about Tajlandia: how plots, certificates, payments and gifting work.",
    path: "/faq",
  });
}

export default async function FAQRoute() {
  let faqs: FaqItem[] | null = null;

  try {
    faqs = await fetchFaqs();
  } catch {
    // The page shows a retry message instead.
  }

  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const faqJsonLd = faqs ? createFaqJsonLd(faqs.map(({ question, answer }) => ({ question, answer }))) : null;

  return (
    <>
      {faqJsonLd ? <JsonLd data={faqJsonLd} nonce={nonce} /> : null}
      <FAQPage faqs={faqs} />
    </>
  );
}
