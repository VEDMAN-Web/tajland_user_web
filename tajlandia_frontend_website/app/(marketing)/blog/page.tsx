import type { Metadata } from "next";
import { BlogPage, fetchBlogPage, type BlogListPage } from "@/modules/blog";
import { getPageMetadata } from "@/lib/seo/metadata";
import { routes } from "@/lib/constants/routes";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata({
    title: "Blog",
    description:
      "Destination guides, travel stories and updates from Tajlandia, the interactive map of Thailand where you can collect symbolic plots.",
    path: routes.blog,
  });
}

export default async function Page() {
  let initialPage: BlogListPage | null = null;

  try {
    initialPage = await fetchBlogPage(1);
  } catch {
    // The page shows a retry message instead.
  }

  return <BlogPage initialPage={initialPage} />;
}
