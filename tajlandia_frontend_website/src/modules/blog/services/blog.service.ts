"use server";

import type { BlogListPage } from "../schemas/blog.schema";
import { fetchBlogPage } from "./blog.api";

export type BlogPageActionResult =
  { ok: true; data: BlogListPage } | { ok: false; message: string };

/** "Show More" on the blog list: the next page, fetched on the server (the endpoint is public). */
export async function loadBlogPageAction(page: number): Promise<BlogPageActionResult> {
  if (!Number.isInteger(page) || page < 1 || page > 1000) {
    return { ok: false, message: "Unable to load more articles." };
  }

  try {
    return { ok: true, data: await fetchBlogPage(page) };
  } catch {
    return { ok: false, message: "Unable to load more articles. Please try again." };
  }
}
