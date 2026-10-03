import type {
  PlotFilters,
  PlotSortOption,
  ZoneCategory,
} from "../types/explore-filters.types";

export const DEFAULT_PLOT_SORT: PlotSortOption = "recommended";

export const PLOT_SORT_OPTIONS: ReadonlyArray<{
  value: PlotSortOption;
  label: string;
  description?: string;
  hint?: string;
  /** Translated and appended to `hint`. */
  hintUnit?: string;
  badge?: "default" | "recent";
}> = [
  {
    value: "recommended",
    label: "Recommended",
    description: "Curated by premier parcel score",
    badge: "default",
  },
  { value: "price-asc", label: "Price: Low to High", hint: "$ → $$$" },
  { value: "price-desc", label: "Price: High to Low", hint: "$$$ → $" },
  {
    value: "area-asc",
    label: "Land Area: Small to Large",
    hint: "1 → 50",
    hintUnit: "Rai",
  },
  {
    value: "area-desc",
    label: "Land Area: Large to Small",
    hint: "50 → 1",
    hintUnit: "Rai",
  },
  { value: "newest", label: "Newest Added", badge: "recent" },
];

export const ZONE_CATEGORY_OPTIONS: ReadonlyArray<{
  value: ZoneCategory;
  label: string;
}> = [
  { value: "ICON", label: "Icon" },
  { value: "POPULAR", label: "Popular" },
  { value: "STANDARD", label: "Standard" },
];

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
