import "server-only";

import { apiGet } from "@/lib/api/client";
import { apiEnvelope } from "@/lib/api/envelope";
import { faqListPageSchema, type FaqItem } from "../schemas/faq.schema";

// The page has no pagination, so take the API's maximum page size.
const FAQ_LIMIT = 100;
// FAQs change rarely; serve them from the cache for a few minutes.
const FAQ_REVALIDATE_SECONDS = 300;
const FAQ_TIMEOUT_MS = 15_000;

/** Every FAQ, by `displayOrder` (ties keep the API's order). */
export async function fetchFaqs(): Promise<FaqItem[]> {
  const response = await apiGet(
    `/page/faq?page=1&limit=${FAQ_LIMIT}`,
    apiEnvelope(faqListPageSchema),
    {
      revalidate: FAQ_REVALIDATE_SECONDS,
      timeoutMs: FAQ_TIMEOUT_MS,
    },
  );

  return sortFaqs(response.data.items);
}

export function sortFaqs(items: FaqItem[]): FaqItem[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort(
      (a, b) =>
        (a.item.displayOrder ?? Number.MAX_SAFE_INTEGER) -
          (b.item.displayOrder ?? Number.MAX_SAFE_INTEGER) || a.index - b.index,
    )
    .map(({ item }) => item);
}
