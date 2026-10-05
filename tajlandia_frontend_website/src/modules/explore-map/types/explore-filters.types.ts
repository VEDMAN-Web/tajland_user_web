export type { FilterOptions } from "../schemas/explore-filters.schema";

// Options come from `/explore/filters` and `/explore/sort-options`; applied
// values become `/explore/plots` query params.

/** Dashboard `t()` from DashboardLanguageContext, passed down by the page. */
export type Translate = (source: string) => string;

/** `GET /explore/plots` sort params (Swagger: `sortBy` is sizeRai, totalPrice or createdAt). */
export type PlotSortQuery = {
  sortBy?: "totalPrice" | "sizeRai" | "createdAt";
  sortOrder?: "asc" | "desc";
};

/** A row of the Sort panel, built from `GET /explore/sort-options`. */
export type PlotSortOption = {
  /** Unique per option (the API's `id` repeats). */
  key: string;
  label: string;
  description?: string;
  /** Range text on the right, e.g. "$ → $$$". */
  hint?: string;
  badge?: "default" | "recent";
  query: PlotSortQuery;
};

export type PlotFilters = {
  // UI only: the plots API has no params for these yet.
  myPlots: boolean;
  giftedPlots: boolean;
  /** Zone ids from `/explore/filters`. Empty means "All Zones". */
  zones: string[];
  minRai: string;
  maxRai: string;
  minPrice: string;
  maxPrice: string;
};

/** `GET /explore/plots` filter params. */
export type PlotFilterQuery = {
  /** JSON array string of zone ids, e.g. `["id1","id2"]` (the API rejects `id1,id2`). */
  zoneId?: string;
  minRai?: number;
  maxRai?: number;
  minPrice?: number;
  maxPrice?: number;
};
