import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalPage, fetchLegalPageBySlug } from "@/modules/legal";
import { legalPagePath } from "@/lib/constants/routes";
import { createPageMetadata } from "@/lib/seo/metadata";

type LegalRouteProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: LegalRouteProps): Promise<Metadata> {
  const { slug } = await params;
  let page: Awaited<ReturnType<typeof fetchLegalPageBySlug>>;
  try {
    page = await fetchLegalPageBySlug(slug);
  } catch {
    // The API failed (not a missing page): the page shows its own error, keep generic tags.
    return createPageMetadata({
      title: "Legal",
      description: "Tajlandia legal documents.",
      path: `/legal/${slug}`,
      index: false,
    });
  }

  // No such page: the not-found page's title and robots tag.
  if (!page) notFound();

  return createPageMetadata({
    title: page.title,
    description: page.description || "Tajlandia legal documents.",
    path: legalPagePath(page.title),
  });
}

export default async function Page({ params }: LegalRouteProps) {
  const { slug } = await params;
  const page = await fetchLegalPageBySlug(slug);

  if (!page) {
    notFound();
  }

  return <LegalPage page={page} />;
}
