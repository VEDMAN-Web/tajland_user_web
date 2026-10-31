import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createPageMetadata } from "@/lib/seo/metadata";
import { DashboardLegalPage } from "@/modules/dashboard";
import { fetchLegalPageByKind } from "@/modules/legal";

export const metadata: Metadata = createPageMetadata({
  title: "Privacy Policy",
  description: "Tajlandia Privacy Policy.",
  path: "/dashboard/privacy",
  index: false,
});

export default async function DashboardPrivacyPage() {
  const page = await fetchLegalPageByKind("privacy");
  if (!page) notFound();

  return <DashboardLegalPage page={page} />;
}
