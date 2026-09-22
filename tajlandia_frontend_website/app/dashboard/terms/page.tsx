import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/metadata";
import { LegalDocumentPage } from "@/modules/dashboard";

export const metadata: Metadata = createPageMetadata({
  title: "Terms & Condition",
  description: "Tajlandia Terms and Conditions.",
  path: "/dashboard/terms",
  index: false,
});

export default function DashboardTermsPage() {
  return <LegalDocumentPage kind="terms" />;
}
