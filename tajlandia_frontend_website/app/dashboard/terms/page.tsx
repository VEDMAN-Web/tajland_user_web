import type { Metadata } from "next";
import { connection } from "next/server";
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
  // Read at request time, not during the build (the legal pages API is live content).
  await connection();
  const page = await fetchLegalPageByKind("terms");
  if (!page) notFound();

  return <DashboardLegalPage page={page} />;
}
