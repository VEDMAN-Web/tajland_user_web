// UI-only for now. When `/explore/filters`, `/explore/sort-options` and
// `/explore/plots` are wired up, map these to their query params.

/** Dashboard `t()` from DashboardLanguageContext, passed down by the page. */
export type Translate = (source: string) => string;

export type PlotSortOption =
  "recommended" | "price-asc" | "price-desc" | "area-asc" | "area-desc" | "newest";

export type ZoneCategory = "ICON" | "POPULAR" | "STANDARD";

export type PlotFilters = {
  myPlots: boolean;
  giftedPlots: boolean;
  /** Empty means "All Zones". */
  zones: ZoneCategory[];
  minRai: string;
  maxRai: string;
  minPrice: string;
  maxPrice: string;
};
