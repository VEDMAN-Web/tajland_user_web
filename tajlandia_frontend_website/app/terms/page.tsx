import type { Metadata } from "next";
import { getPageMetadata } from "@/lib/seo/metadata";
import { LegalDocumentPage } from "@/modules/dashboard";

export async function generateMetadata(): Promise<Metadata> {
  // Stays noindex until the terms text has been approved by counsel.
  return getPageMetadata({
    title: "Terms & Condition",
    description: "Tajlandia Terms and Conditions.",
    path: "/terms",
    index: false,
  });
}

export default function TermsPage() {
  return <LegalDocumentPage kind="terms" publicPage />;
}
