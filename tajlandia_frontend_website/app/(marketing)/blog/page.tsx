import type { Metadata } from "next";
import { BlogPage, fetchBlogPage, type BlogListPage } from "@/modules/blog";
import { createPageMetadata } from "@/lib/seo/metadata";
import { routes } from "@/lib/constants/routes";

export const metadata: Metadata = createPageMetadata({
  title: "Blog",
  description: "Stories and destination guides will live here.",
  path: routes.blog,
  index: false,
});

export default async function Page() {
  let initialPage: BlogListPage | null = null;

  try {
    initialPage = await fetchBlogPage(1);
  } catch {
    // The page shows a retry message instead.
  }

  return <BlogPage initialPage={initialPage} />;
}
