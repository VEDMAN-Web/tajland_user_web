import { z } from "zod";
import { authedDelete, authedGet, authedPost } from "@/lib/api/browser-client";
import { SORT_QUERY_BY_NAME } from "../constants/explore-filters";
import {
  filterOptionsSchema,
  type FilterOptions,
} from "../schemas/explore-filters.schema";
import { exploreMapSchema } from "../schemas/explore-map.schema";
import {
  explorePlotDetailSchema,
  explorePlotsPageSchema,
  type ExplorePlot,
  type ExplorePlotDetail,
} from "../schemas/explore-plots.schema";
import {
  recentSearchesSchema,
  searchResultsSchema,
  searchSuggestionsSchema,
} from "../schemas/explore-search.schema";
import { sortOptionsSchema, type SortOptionDto } from "../schemas/explore-sort.schema";
import type {
  PlotFilterQuery,
  PlotSortOption,
  PlotSortQuery,
} from "../types/explore-filters.types";
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
/** Recent searches per page ("More" loads the next page). */
export const RECENT_SEARCH_PAGE_SIZE = 10;

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

/**
 * One page of the user's recent searches, newest first, as sent (duplicates
 * included). The API sends no total, so a full page means there may be more.
 */
export function getRecentSearches(
  page = 1,
  signal?: AbortSignal,
): Promise<RecentSearch[]> {
  return authedGet("/explore/recent-searches", recentSearchesSchema, {
    query: { page, limit: RECENT_SEARCH_PAGE_SIZE },
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

/** Every plot in the area matching the filters, in the given order, following pagination. */
export async function getPlotsInArea(
  scope: PlotScope,
  { sort, filters }: { sort: PlotSortQuery; filters: PlotFilterQuery },
  signal?: AbortSignal,
): Promise<ExplorePlot[]> {
  const plots: ExplorePlot[] = [];
  for (let page = 1; page <= MAX_PLOT_PAGES; page += 1) {
    const data = await authedGet("/explore/plots", explorePlotsPageSchema, {
      query: {
        [scope.param]: scope.id,
        page,
        limit: PLOTS_PAGE_SIZE,
        ...filters,
        sortBy: sort.sortBy,
        sortOrder: sort.sortOrder,
      },
      signal,
    });
    plots.push(...data.items);
    if (page >= data.pagination.totalPages) break;
  }
  return plots;
}

/** Full details of one plot (detail panel). 404 means the plot no longer exists. */
export function getPlotDetail(
  plotId: string,
  signal?: AbortSignal,
): Promise<ExplorePlotDetail> {
  return authedGet(
    `/explore/plots/${encodeURIComponent(plotId)}`,
    explorePlotDetailSchema,
    {
      signal,
    },
  );
}

/**
 * Sort panel rows from the API's options. The "DEFAULT" option keeps the
 * backend's own order (no params); others need a known mapping or are dropped.
 */
export function toPlotSortOptions(options: SortOptionDto[]): PlotSortOption[] {
  const rows: PlotSortOption[] = [];
  for (const option of options) {
    if (option.type === "DEFAULT") {
      // Here `id` is the label and `name` the description.
      rows.push({
        key: option.id,
        label: option.id,
        description: option.name,
        badge: "default",
        query: {},
      });
      continue;
    }
    const query = SORT_QUERY_BY_NAME[option.name];
    if (!query) continue;
    rows.push({
      key: option.name,
      label: option.name,
      ...(option.type === "Recent"
        ? { badge: "recent" as const }
        : { hint: option.type }),
      query,
    });
  }
  // Keys must be unique (they identify the picked option).
  return rows.filter((row, index) => rows.findIndex((r) => r.key === row.key) === index);
}

/** Options for the Sort panel (load once; they don't change per area). */
export async function getSortOptions(signal?: AbortSignal): Promise<PlotSortOption[]> {
  const data = await authedGet("/explore/sort-options", sortOptionsSchema, { signal });
  return toPlotSortOptions(data.options);
}

/** Zone types and size / price ranges for the Filter panel (load once per page). */
export function getFilterOptions(signal?: AbortSignal): Promise<FilterOptions> {
  return authedGet("/explore/filters", filterOptionsSchema, { signal });
}
