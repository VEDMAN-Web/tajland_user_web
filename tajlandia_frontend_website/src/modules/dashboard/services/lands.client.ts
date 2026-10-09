import { authedGet } from "@/lib/api/browser-client";
import {
  landOverviewSchema,
  landPlotsSchema,
  type LandOverview,
  type LandPlotsPage,
} from "../schemas/lands.schema";

/** My Land totals: owned Rai, distinct regions and amount spent. */
export function getLandOverview(signal?: AbortSignal): Promise<LandOverview> {
  return authedGet("/lands/overview", landOverviewSchema, { signal });
}

export type LandPlotsQuery = {
  page?: number;
  limit?: number;
  /** "self", "gift" or "self,gift"; omitted for both. */
  purchaseType?: string;
  /** Comma-separated "icon", "popular", "standard"; omitted for all. */
  zone?: string;
  minRai?: number;
  maxRai?: number;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "plotNumber" | "raiSize" | "totalPrice" | "createdAt";
  sortOrder?: "asc" | "desc";
};

/**
 * The user's paid plots, one per order item, filtered and sorted on the
 * server. 400 when a filter is invalid (e.g. min above max).
 */
export function getLandPlots(
  query: LandPlotsQuery,
  signal?: AbortSignal,
): Promise<LandPlotsPage> {
  return authedGet("/lands/plots", landPlotsSchema, { query, signal });
}
