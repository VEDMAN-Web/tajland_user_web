import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/metadata";
import { LegalDocumentPage } from "@/modules/dashboard";

export const metadata: Metadata = createPageMetadata({ title: "Privacy Policy", description: "Tajlandia Privacy Policy.", path: "/privacy", index: false });

export default function PrivacyPage() {
  return <LegalDocumentPage kind="privacy" />;
}
