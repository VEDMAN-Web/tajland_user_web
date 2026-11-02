import type { SearchPlotResult, SearchResult } from "../schemas/explore-search.schema";

export type { ExploreMap, ExploreRegion, MapBounds } from "../schemas/explore-map.schema";
export type {
  RecentSearch,
  SearchPlotResult,
  SearchResult,
  SearchSuggestion,
} from "../schemas/explore-search.schema";

/** What the search list shows: a region or city, or a plot found by its number. */
export type SearchHit = SearchResult | SearchPlotResult;
export type { ExplorePlot, ExplorePlotDetail } from "../schemas/explore-plots.schema";
