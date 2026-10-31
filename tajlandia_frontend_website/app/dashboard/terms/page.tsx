import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createPageMetadata } from "@/lib/seo/metadata";
import { DashboardLegalPage } from "@/modules/dashboard";
import { fetchLegalPageByKind } from "@/modules/legal";

export const metadata: Metadata = createPageMetadata({
  title: "Terms & Condition",
  description: "Tajlandia Terms & Conditions.",
  path: "/dashboard/terms",
  index: false,
});

export default async function DashboardTermsPage() {
  const page = await fetchLegalPageByKind("terms");
  if (!page) notFound();

  return <DashboardLegalPage page={page} />;
}
