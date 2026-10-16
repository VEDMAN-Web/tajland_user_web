import "server-only";

import { cache } from "react";
import { apiGet, isApiError } from "@/lib/api/client";
import { apiEnvelope } from "@/lib/api/envelope";
import {
  blogDetailSchema,
  blogListPageSchema,
  type BlogDetail,
  type BlogListPage,
} from "../schemas/blog.schema";

export const BLOG_PAGE_SIZE = 6;
// Published articles change rarely; serve them from the cache for a few minutes.
const BLOG_REVALIDATE_SECONDS = 300;
const BLOG_TIMEOUT_MS = 15_000;
const BLOG_ID = /^[a-f\d]{24}$/i;

export function isBlogId(value: string) {
  return BLOG_ID.test(value);
}

export async function fetchBlogPage(
  page: number,
  limit = BLOG_PAGE_SIZE,
): Promise<BlogListPage> {
  const response = await apiGet(
    `/page/blog?page=${page}&limit=${limit}`,
    apiEnvelope(blogListPageSchema),
    { revalidate: BLOG_REVALIDATE_SECONDS, timeoutMs: BLOG_TIMEOUT_MS },
  );
  return response.data;
}

/** One article, or null when it doesn't exist (bad id or 404). Shared by metadata and page. */
export const fetchBlogPost = cache(async (blogId: string): Promise<BlogDetail | null> => {
  if (!isBlogId(blogId)) return null;

  try {
    const response = await apiGet(`/page/blog/${blogId}`, apiEnvelope(blogDetailSchema), {
      revalidate: BLOG_REVALIDATE_SECONDS,
      timeoutMs: BLOG_TIMEOUT_MS,
    });
    return response.data;
  } catch (error) {
    if (isApiError(error) && (error.status === 404 || error.status === 400)) return null;
    throw error;
  }
});
