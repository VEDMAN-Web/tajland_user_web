import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/metadata";
import { MyCertificatesPage } from "@/modules/dashboard";

export const metadata: Metadata = createPageMetadata({ title: "My Certificates", description: "View and download your Tajlandia certificates.", path: "/dashboard/certificates", index: false });

export default function DashboardCertificatesPage() {
  return <MyCertificatesPage />;
}
