import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/metadata";
import { CertificateDetailsPage } from "@/modules/dashboard";

export const metadata: Metadata = createPageMetadata({
  title: "Certificate Details",
  description: "View your Tajlandia certificate details.",
  path: "/dashboard/certificates",
  index: false,
});

export default async function CertificateDetailsRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CertificateDetailsPage certificateId={decodeURIComponent(id)} />;
}
