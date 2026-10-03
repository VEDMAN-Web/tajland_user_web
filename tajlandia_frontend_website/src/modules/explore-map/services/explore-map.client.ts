import { z } from "zod";
import { authedDelete, authedGet, authedPost } from "@/lib/api/browser-client";
import { exploreMapSchema } from "../schemas/explore-map.schema";
import {
  explorePlotsPageSchema,
  type ExplorePlot,
} from "../schemas/explore-plots.schema";
import {
  recentSearchesSchema,
  searchResultsSchema,
  searchSuggestionsSchema,
} from "../schemas/explore-search.schema";
import type {
  ExploreMap,
  RecentSearch,
  SearchResult,
  SearchSuggestion,
} from "../types/explore-map.types";

/** The backend rejects shorter queries with 400, so callers skip the request. */
export const MIN_SUGGESTION_QUERY_LENGTH = 2;
const SUGGESTION_LIMIT = 5;
const SEARCH_LIMIT = 20;
const RECENT_SEARCH_LIMIT = 10;

/** Map bounds/center and the regions shown on the Explore Map. */
export function getExploreMap(signal?: AbortSignal): Promise<ExploreMap> {
  return authedGet("/explore/map", exploreMapSchema, { signal });
}

/** Autocomplete matches for the search box, best match first. */
export async function getSearchSuggestions(
  query: string,
  signal?: AbortSignal,
): Promise<SearchSuggestion[]> {
  const data = await authedGet("/explore/search/suggestions", searchSuggestionsSchema, {
    query: { q: query, limit: SUGGESTION_LIMIT },
    signal,
  });
  return data.suggestions;
}

/**
 * Full search for the results list. The backend saves every call to the user's
 * recent searches, so only call this when the user submits, not per keystroke.
 */
export async function searchPlaces(
  query: string,
  signal?: AbortSignal,
): Promise<SearchResult[]> {
  const data = await authedGet("/explore/search", searchResultsSchema, {
    query: { q: query, limit: SEARCH_LIMIT },
    signal,
  });
  return data.results;
}

/** The user's recent searches, newest first (the backend saves every `searchPlaces`). */
export function getRecentSearches(signal?: AbortSignal): Promise<RecentSearch[]> {
  return authedGet("/explore/recent-searches", recentSearchesSchema, {
    query: { limit: RECENT_SEARCH_LIMIT },
    signal,
  });
}

// Delete/save responses aren't documented; the UI only needs success/failure.
// `.optional()`: these responses have no `data` at all, and in Zod 4 a plain
// `z.unknown()` key is still required.
const ignoredResultSchema = z.unknown().optional();

export async function deleteRecentSearch(id: string): Promise<void> {
  await authedDelete(
    `/explore/recent-searches/${encodeURIComponent(id)}`,
    ignoredResultSchema,
  );
}

export async function clearRecentSearches(): Promise<void> {
  await authedDelete("/explore/recent-searches", ignoredResultSchema);
}

export type SaveRecentSearchInput = {
  query: string;
  type: "LOCATION" | "REGION" | "CITY" | "PLOT";
  /** Region, city or plot id, so the backend can attach its image. */
  referenceId?: string;
};

/** Saves a place the user picked to their recent searches. */
export async function saveRecentSearch(input: SaveRecentSearchInput): Promise<void> {
  await authedPost("/explore/recent-searches", input, ignoredResultSchema);
}

/** Which area to load plots for (one of the API's geographic filters). */
export type PlotScope = { param: "regionId" | "cityId" | "zoneId"; id: string };

const PLOTS_PAGE_SIZE = 100;
// Safety cap so a huge area can't fire unbounded requests (100 x 20 = 2,000 plots).
const MAX_PLOT_PAGES = 20;

/** Every plot in the area, following pagination (no sort or extra filters yet). */
export async function getPlotsInArea(
  scope: PlotScope,
  signal?: AbortSignal,
): Promise<ExplorePlot[]> {
  const plots: ExplorePlot[] = [];
  for (let page = 1; page <= MAX_PLOT_PAGES; page += 1) {
    const data = await authedGet("/explore/plots", explorePlotsPageSchema, {
      query: { [scope.param]: scope.id, page, limit: PLOTS_PAGE_SIZE },
      signal,
    });
    plots.push(...data.items);
    if (page >= data.pagination.totalPages) break;
  }
  return plots;
}
