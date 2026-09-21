import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/metadata";
import { LegalDocumentPage } from "@/modules/dashboard";

export const metadata: Metadata = createPageMetadata({
  title: "Terms & Condition",
  description: "Tajlandia Terms and Conditions.",
  path: "/terms",
  index: false,
});

export default function TermsPage() {
  return <LegalDocumentPage kind="terms" publicPage />;
}
