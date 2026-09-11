import type { Metadata } from "next";
import { BlogPage } from "@/modules/blog";
import { createPageMetadata } from "@/lib/seo/metadata";
import { routes } from "@/lib/constants/routes";

export const metadata: Metadata = createPageMetadata({
  title: "Blog",
  description: "Stories and destination guides will live here.",
  path: routes.blog,
  index: false,
});

export default function Page() {
  return <BlogPage />;
}
