/**
 * Explore Map service layer.
 *
 * Every function maps 1-to-1 with a backend endpoint, validates the response
 * with the corresponding Zod schema, and returns the typed `.data` payload so
 * callers never touch raw API envelopes.
 *
 * All functions are async and throw BrowserApiError on failure — hooks
 * catch and surface those errors in their own state.
 */

import { browserDelete, browserGet, browserPost } from "@/lib/api/client.browser";
import {
  deleteSearchResponseSchema,
  exploreMapResponseSchema,
  filterOptionsResponseSchema,
  myPlotsResponseSchema,
  plotDetailResponseSchema,
  plotEligibilityResponseSchema,
  plotStatusResponseSchema,
  plotsListResponseSchema,
  recentSearchesResponseSchema,
  saveSearchResponseSchema,
  searchResponseSchema,
  searchSuggestionsResponseSchema,
  sortOptionsResponseSchema,
  type ExploreMapResponse,
  type FilterOptions,
  type MapConfig,
  type MyPlotItem,
  type Pagination,
  type PlotDetail,
  type PlotEligibilityData,
  type PlotFilterParams,
  type PlotListItem,
  type PlotStatusData,
  type RecentSearchItem,
  type SearchResult,
  type SortOption,
  type Suggestion,
} from "@/lib/api/explore.schemas";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Strip undefined values so URLSearchParams stays clean. */
function toQueryParams(
  obj: Record<string, string | number | boolean | undefined>,
): Record<string, string | number | boolean | undefined> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== ""),
  );
}

/** Validate raw response with a Zod schema, throw on mismatch. */
function validate<T>(schema: { safeParse: (v: unknown) => { success: boolean; data?: T; error?: unknown } }, raw: unknown): T {
  const result = schema.safeParse(raw);
  if (!result.success) {
    console.error("[explore service] schema mismatch", result.error);
    console.error("[explore service] raw response:", JSON.stringify(raw, null, 2));
    throw new Error("Unexpected API response shape");
  }
  return result.data as T;
}

// ─── 1. Map ───────────────────────────────────────────────────────────────────

export type ExploreMapData = {
  map: MapConfig;
  regions: ExploreMapResponse["data"]["regions"];
  plots: ExploreMapResponse["data"]["plots"];
};

/**
 * GET /explore/map
 * Load Thailand map config, regions and plot markers for initial render.
 */
export async function fetchExploreMap(bbox?: string): Promise<ExploreMapData> {
  const raw = await browserGet<unknown>(
    "/explore/map",
    bbox ? { bbox } : undefined,
  );
  const parsed = validate(exploreMapResponseSchema, raw);
  const data = parsed.data;

  // Ensure plots array exists (backend may omit it)
  const plots = data.plots || [];

  return {
    ...data,
    plots,
  };
}

// ─── 2. Plot list ─────────────────────────────────────────────────────────────

export type PlotsPage = {
  items: PlotListItem[];
  pagination: Pagination;
};

/**
 * GET /explore/plots
 * Paginated, filtered, sorted list of plots.
 * NOTE: avoid combining sortBy + status simultaneously (known 500 on backend).
 */
export async function fetchPlots(params: PlotFilterParams = {}): Promise<PlotsPage> {
  const raw = await browserGet<unknown>(
    "/explore/plots",
    toQueryParams(params as Record<string, string | number | boolean | undefined>),
  );
  const parsed = validate(plotsListResponseSchema, raw);
  
  return parsed.data;
}

// ─── 3. Single plot detail ────────────────────────────────────────────────────

/**
 * GET /explore/plots/:plotId
 * Full detail for a single plot — used when user taps a marker.
 */
export async function fetchPlotDetail(plotId: string): Promise<PlotDetail> {
  const raw = await browserGet<unknown>(`/explore/plots/${plotId}`);
  const parsed = validate(plotDetailResponseSchema, raw);
  return parsed.data;
}

// ─── 4. Plot status (lightweight poll) ───────────────────────────────────────

/**
 * GET /explore/plots/:plotId/status
 * Lightweight status check — use for polling every 30-60 s to keep
 * marker colors fresh without fetching full detail.
 */
export async function fetchPlotStatus(plotId: string): Promise<PlotStatusData> {
  const raw = await browserGet<unknown>(`/explore/plots/${plotId}/status`);
  const parsed = validate(plotStatusResponseSchema, raw);
  return parsed.data;
}

// ─── 5. Purchase eligibility ──────────────────────────────────────────────────

/**
 * POST /explore/plots/:plotId/eligibility
 * Check whether the authenticated user can add this plot to cart.
 * Call immediately before showing "Add to Cart".
 */
export async function checkPlotEligibility(plotId: string): Promise<PlotEligibilityData> {
  const raw = await browserPost<unknown>(`/explore/plots/${plotId}/eligibility`);
  const parsed = validate(plotEligibilityResponseSchema, raw);
  return parsed.data;
}

// ─── 6. Filter options ────────────────────────────────────────────────────────

/**
 * GET /explore/filters
 * All available filter options — regions, cities, zone types, statuses,
 * price & rai ranges. Fetch once on mount; cache at hook level.
 * 
 * NOTE: Backend requires authentication for this endpoint.
 * Returns default filter structure if user is not authenticated.
 */
export async function fetchFilterOptions(): Promise<FilterOptions> {
  try {
    const raw = await browserGet<unknown>("/explore/filters");
    const parsed = validate(filterOptionsResponseSchema, raw);
    return parsed.data;
  } catch (error) {
    // If unauthorized (401), return default filter options
    // This allows unauthenticated users to still browse the map
    if (error instanceof Error && 'status' in error && (error as any).status === 401) {
      console.warn("[explore service] Filter options require authentication, using defaults");
      return {
        regions: [],
        cities: [],
        zoneTypes: [],
        landTypes: [],
        statuses: ["AVAILABLE", "RESERVED", "SOLD"],
        priceRange: { min: 0, max: 10000000 },
        raiRange: { min: 0, max: 100 },
      };
    }
    throw error;
  }
}

// ─── 7. Sort options ──────────────────────────────────────────────────────────

/**
 * GET /explore/sort-options
 * Available sort fields for the plot list. Fetch once on mount.
 * 
 * NOTE: Backend may require authentication for this endpoint.
 * Returns default sort options if user is not authenticated.
 */
export async function fetchSortOptions(): Promise<SortOption[]> {
  try {
    const raw = await browserGet<unknown>("/explore/sort-options");
    const parsed = validate(sortOptionsResponseSchema, raw);
    return parsed.data.options;
  } catch (error) {
    // If unauthorized (401), return default sort options
    if (error instanceof Error && 'status' in error && (error as any).status === 401) {
      console.warn("[explore service] Sort options require authentication, using defaults");
      return [
        { id: "price-asc", name: "Price: Low to High" },
        { id: "price-desc", name: "Price: High to Low" },
        { id: "rai-asc", name: "Size: Small to Large" },
        { id: "rai-desc", name: "Size: Large to Small" },
        { id: "createdAt-desc", name: "Newest First" },
        { id: "createdAt-asc", name: "Oldest First" },
      ];
    }
    throw error;
  }
}

// ─── 8. Search ────────────────────────────────────────────────────────────────

/**
 * GET /explore/search
 * Full search — auto-saves the query to recent history server-side.
 */
export async function searchPlots(
  query: string,
  limit = 20,
): Promise<{ query: string; results: SearchResult[] }> {
  const raw = await browserGet<unknown>("/explore/search", {
    q: query,
    limit,
  });
  const parsed = validate(searchResponseSchema, raw);
  return parsed.data;
}

// ─── 9. Search suggestions (autocomplete) ────────────────────────────────────

/**
 * GET /explore/search/suggestions
 * Debounced autocomplete — call at ≥2 chars, 300 ms debounce.
 */
export async function fetchSearchSuggestions(
  query: string,
  limit = 10,
): Promise<{ query: string; suggestions: Suggestion[] }> {
  const raw = await browserGet<unknown>("/explore/search/suggestions", {
    q: query,
    limit,
  });
  const parsed = validate(searchSuggestionsResponseSchema, raw);
  return parsed.data;
}

// ─── 10. Recent searches ──────────────────────────────────────────────────────

/**
 * GET /explore/recent-searches
 * Authenticated user's search history (most recent first).
 */
export async function fetchRecentSearches(limit = 10): Promise<RecentSearchItem[]> {
  const raw = await browserGet<unknown>("/explore/recent-searches", { limit });
  const parsed = validate(recentSearchesResponseSchema, raw);
  return parsed.data;
}

/**
 * POST /explore/recent-searches
 * Manually persist a search (the GET /explore/search auto-saves too,
 * but this is useful for direct location taps that bypass the search box).
 */
export async function saveRecentSearch(
  query: string,
  type: "LOCATION" | "ZONE" | "PLOT" = "LOCATION",
  referenceId?: string,
): Promise<RecentSearchItem> {
  const raw = await browserPost<unknown>("/explore/recent-searches", {
    query,
    type,
    ...(referenceId ? { referenceId } : {}),
  });
  const parsed = validate(saveSearchResponseSchema, raw);
  return parsed.data;
}

/**
 * DELETE /explore/recent-searches/:id
 * Remove a single search history entry.
 */
export async function deleteRecentSearch(id: string): Promise<void> {
  const raw = await browserDelete<unknown>(`/explore/recent-searches/${id}`);
  validate(deleteSearchResponseSchema, raw);
}

/**
 * DELETE /explore/recent-searches
 * Clear the entire search history for the authenticated user.
 */
export async function clearRecentSearches(): Promise<void> {
  const raw = await browserDelete<unknown>("/explore/recent-searches");
  validate(deleteSearchResponseSchema, raw);
}

// ─── 11. My plots ─────────────────────────────────────────────────────────────

export type MyPlotsPage = {
  items: MyPlotItem[];
};

/**
 * GET /explore/my-plots
 * Plots owned / claimed by the authenticated user.
 * Used to colour "Your plots" markers on the map.
 */
export async function fetchMyPlots(
  page = 1,
  limit = 100,
  sortBy = "createdAt",
  sortOrder: "asc" | "desc" = "desc",
): Promise<MyPlotItem[]> {
  try {
    const raw = await browserGet<unknown>("/explore/my-plots", {
      page,
      limit,
      sortBy,
      sortOrder,
    });
    const parsed = validate(myPlotsResponseSchema, raw);
    return parsed.data;
  } catch (error) {
    // Return empty array if user has no plots or endpoint fails
    // This is non-critical for map functionality
    console.warn("[fetchMyPlots] Failed to load user plots:", error);
    return [];
  }
}
