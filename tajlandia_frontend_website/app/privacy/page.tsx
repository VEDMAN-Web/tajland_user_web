import type { Metadata } from "next";
import { getPageMetadata } from "@/lib/seo/metadata";
import { LegalDocumentPage } from "@/modules/dashboard";

export async function generateMetadata(): Promise<Metadata> {
  // Stays noindex until the privacy policy has been approved by counsel.
  return getPageMetadata({
    title: "Privacy Policy",
    description: "Tajlandia Privacy Policy.",
    path: "/privacy",
    index: false,
  });
}

export default function PrivacyPage() {
  return <LegalDocumentPage kind="privacy" publicPage />;
}
