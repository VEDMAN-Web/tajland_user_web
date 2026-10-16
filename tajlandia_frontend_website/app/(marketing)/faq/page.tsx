import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/metadata";
import { FAQPage, fetchFaqs, type FaqItem } from "@/modules/faq";

export const metadata: Metadata = createPageMetadata({
  title: "FAQ",
  description: "Frequently asked questions about Tajlandia.",
  path: "/faq",
});

export default async function FAQRoute() {
  let faqs: FaqItem[] | null = null;

  try {
    faqs = await fetchFaqs();
  } catch {
    // The page shows a retry message instead.
  }

  return <FAQPage faqs={faqs} />;
}
