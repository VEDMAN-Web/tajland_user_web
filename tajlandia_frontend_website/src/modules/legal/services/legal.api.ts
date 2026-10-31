import "server-only";

import { cache } from "react";
import { apiGet, isApiError } from "@/lib/api/client";
import { apiEnvelope } from "@/lib/api/envelope";
import { legalSlug } from "@/lib/constants/routes";
import {
  legalPageDetailSchema,
  legalPageListSchema,
  type LegalPageDetail,
  type LegalPageListItem,
} from "../schemas/legal.schema";

// Legal text changes rarely; serve it from the cache for a few minutes.
const LEGAL_REVALIDATE_SECONDS = 300;
const LEGAL_TIMEOUT_MS = 15_000;
const LEGAL_ID = /^[a-f\d]{24}$/i;

export function isLegalPageId(value: string) {
  return LEGAL_ID.test(value);
}

/** The published legal pages (id and title), in the order the backend sends them. */
export const fetchLegalPages = cache(async (): Promise<LegalPageListItem[]> => {
  const response = await apiGet("/page/legal-pages", apiEnvelope(legalPageListSchema), {
    revalidate: LEGAL_REVALIDATE_SECONDS,
    timeoutMs: LEGAL_TIMEOUT_MS,
  });
  return response.data;
});

/** The footer's links: an API failure leaves it without them instead of breaking every page. */
export async function fetchLegalLinks(): Promise<LegalPageListItem[]> {
  try {
    return await fetchLegalPages();
  } catch {
    return [];
  }
}

/** The id of the legal page whose title makes this slug, or null. */
async function findLegalPageId(slug: string): Promise<string | null> {
  const pages = await fetchLegalPages();
  return pages.find((page) => legalSlug(page.title) === slug)?._id ?? null;
}

/** One legal page, or null when it doesn't exist (bad id or 404). Shared by metadata and page. */
export const fetchLegalPage = cache(
  async (legalPageId: string): Promise<LegalPageDetail | null> => {
    if (!isLegalPageId(legalPageId)) return null;

    try {
      const response = await apiGet(
        `/page/legal-pages/${legalPageId}`,
        apiEnvelope(legalPageDetailSchema),
        { revalidate: LEGAL_REVALIDATE_SECONDS, timeoutMs: LEGAL_TIMEOUT_MS },
      );
      return response.data;
    } catch (error) {
      if (isApiError(error) && (error.status === 404 || error.status === 400)) return null;
      throw error;
    }
  },
);

/** The legal page at `/legal/{slug}`, or null when no published page has that slug. */
export const fetchLegalPageBySlug = cache(async (slug: string): Promise<LegalPageDetail | null> => {
  const id = await findLegalPageId(slug);
  return id ? fetchLegalPage(id) : null;
});

export type LegalKind = "terms" | "privacy";

const KIND_TITLE: Record<LegalKind, RegExp> = {
  terms: /terms/i,
  privacy: /privacy/i,
};

/** The Terms or Privacy Policy page: the first published page whose title says so, or null. */
export const fetchLegalPageByKind = cache(async (kind: LegalKind): Promise<LegalPageDetail | null> => {
  const pages = await fetchLegalPages();
  const match = pages.find((page) => KIND_TITLE[kind].test(page.title));
  return match ? fetchLegalPage(match._id) : null;
});
