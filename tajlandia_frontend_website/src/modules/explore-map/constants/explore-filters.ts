import type {
  PlotFilterQuery,
  PlotFilters,
  PlotSortQuery,
} from "../types/explore-filters.types";

// `/explore/sort-options` sends no sort field or order (and repeats `id`), so
// each option's `name` is mapped to the plots API params here. Options not
// listed are hidden, since we can't sort by them. Ask the backend to send
// `sortBy` / `sortOrder` per option and this table can go.
export const SORT_QUERY_BY_NAME: Readonly<Record<string, PlotSortQuery>> = {
  "Price: Low to High": { sortBy: "totalPrice", sortOrder: "asc" },
  "Price: High to Low": { sortBy: "totalPrice", sortOrder: "desc" },
  "Land Area: Small to Large": { sortBy: "sizeRai", sortOrder: "asc" },
  "Land Area: Large to Small": { sortBy: "sizeRai", sortOrder: "desc" },
  "Newest Added": { sortBy: "createdAt", sortOrder: "desc" },
};

export const DEFAULT_PLOT_FILTERS: PlotFilters = {
  myPlots: false,
  giftedPlots: false,
  zones: [],
  minRai: "",
  maxRai: "",
  minPrice: "",
  maxPrice: "",
};

export const SQUARE_METRES_PER_RAI = 1_600;

/** A typed min/max as a number, or undefined when empty or just ".". */
export function parseFilterNumber(value: string): number | undefined {
  const number = Number.parseFloat(value);
  return Number.isFinite(number) ? number : undefined;
}

/** Both ends set and min above max. */
export function isInvalidRange(min: string, max: string) {
  const low = parseFilterNumber(min);
  const high = parseFilterNumber(max);
  return low !== undefined && high !== undefined && low > high;
}

/** Applied filters as `/explore/plots` params ("My Plots" / "Gifted" aren't sent yet). */
export function toPlotFilterQuery(filters: PlotFilters): PlotFilterQuery {
  return {
    zoneId: filters.zones.length ? JSON.stringify(filters.zones) : undefined,
    minRai: parseFilterNumber(filters.minRai),
    maxRai: parseFilterNumber(filters.maxRai),
    minPrice: parseFilterNumber(filters.minPrice),
    maxPrice: parseFilterNumber(filters.maxPrice),
  };
}
