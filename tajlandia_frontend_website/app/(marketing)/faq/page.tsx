import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/metadata";
import { FAQPage } from "@/modules/faq";

export const metadata: Metadata = createPageMetadata({
  title: "FAQ",
  description: "Frequently asked questions about Tajlandia.",
  path: "/faq",
});

export default function FAQRoute() {
  return <FAQPage />;
}
