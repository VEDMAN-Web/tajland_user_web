import type { BlogListItem } from "../schemas/blog.schema";

const FALLBACK_AUTHOR = "Tajlandia.pl";

/** `2026-09-03T07:00:00.000Z` → `Sep 03, 2026` (the format in the design). */
export function formatBlogDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function blogAuthorName(authorName: BlogListItem["authorName"]): string {
  return authorName?.trim() || FALLBACK_AUTHOR;
}

export function blogHref(post: Pick<BlogListItem, "_id">) {
  return `/blog/${post._id}`;
}
