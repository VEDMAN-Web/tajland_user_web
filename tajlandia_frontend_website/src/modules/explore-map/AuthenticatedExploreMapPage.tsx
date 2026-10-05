"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { isAbortError } from "@/lib/api/browser-client";
import { isApiError } from "@/lib/api/errors";
import { notifyCartChanged } from "@/lib/cart/cart-events";
import { routes } from "@/lib/constants/routes";
import { logError } from "@/lib/logging/logger";
import { useAuth } from "@/lib/hooks/useAuth";
import { DashboardNavbar } from "@/modules/dashboard/DashboardNavbar";
import {
  MapboxMap,
  type MapboxMapHandle,
  type MapboxMapStatus,
  type MapPlot,
} from "@/components/maps/MapboxMap";
import { useDashboardLanguage } from "@/modules/dashboard/DashboardLanguageContext";
import { FilterPlotsPanel } from "./components/FilterPlotsPanel";
import { MapErrorDialog } from "./components/MapErrorDialog";
import { MapUnavailableState } from "./components/MapUnavailableState";
import { PlotCard, PlotCardSkeleton } from "./components/PlotCard";
import {
  PlotDetailError,
  PlotDetailPanel,
  PlotDetailSkeleton,
} from "./components/PlotDetailPanel";
import { RecentSearchRow } from "./components/RecentSearchRow";
import { SearchResultRow } from "./components/SearchResultRow";
import { SortPlotsPanel } from "./components/SortPlotsPanel";
import { DEFAULT_PLOT_FILTERS, toPlotFilterQuery } from "./constants/explore-filters";
import { plotColor } from "./constants/plot-status";
import { exploreFiltersMock } from "./data/explore-filters.mock";
import {
  addPlotToCart,
  clearRecentSearches,
  deleteRecentSearch,
  getExploreMap,
  getRecentSearches,
  RECENT_SEARCH_PAGE_SIZE,
  saveRecentSearch,
  getSearchSuggestions,
  MIN_SUGGESTION_QUERY_LENGTH,
  getFilterOptions,
  getPlotDetail,
  getPlotsInArea,
  getSortOptions,
  searchPlaces,
  type PlotScope,
} from "./services/explore-map.client";
import type {
  FilterOptions,
  PlotFilters,
  PlotSortOption,
} from "./types/explore-filters.types";
import type {
  ExplorePlot,
  ExplorePlotDetail,
  MapBounds,
  RecentSearch,
  SearchResult,
  SearchSuggestion,
} from "./types/explore-map.types";

// Slim, rounded, arrow-less scrollbar for the search panel lists.
// `scrollbar-*` covers Firefox and current Chrome; the `::-webkit-` rules cover Safari.
const SLIM_SCROLLBAR =
  "[scrollbar-width:thin] [scrollbar-color:#d9e1ea_transparent] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#d9e1ea] [&::-webkit-scrollbar-track]:bg-transparent";

// Used until `/explore/map` returns the real bounds.
const THAILAND_BOUNDS: MapBounds = { north: 20.5, south: 5.6, east: 105.6, west: 97.3 };
const SUGGESTION_DEBOUNCE_MS = 300;
// Search runs as the user types. Each call is saved to their recent searches,
// so wait for a longer pause than the autocomplete does.
const SEARCH_DEBOUNCE_MS = 500;
// Recent searches shown before "More from recent history".
const RECENT_PREVIEW_COUNT = 6;
// How close to zoom in for each place type (search uses lowercase, suggestions uppercase).
const PLACE_ZOOM: Record<string, number> = { REGION: 10, CITY: 12, ZONE: 13 };

/** Search result types map to the plots API's area filters. */
function plotScopeFor(place: { type: string; id: string }): PlotScope | null {
  const type = place.type.toUpperCase();
  if (type === "REGION") return { param: "regionId", id: place.id };
  if (type === "CITY") return { param: "cityId", id: place.id };
  if (type === "ZONE") return { param: "zoneId", id: place.id };
  return null;
}

// Closest the "focus" zoom gets, so a tiny plot keeps some streets around it.
const PLOT_FOCUS_MAX_ZOOM = 18;
// Skeleton cards shown while an area's plots load.
const PLOT_SKELETON_COUNT = 3;

/** The plot's outline box, or null when the API sent no geometry. */
function polygonBounds(plot: Pick<ExplorePlot, "geometry">): MapBounds | null {
  const ring = plot.geometry?.coordinates[0];
  if (!ring?.length) return null;
  const lngs = ring.flatMap(([lng]) => (lng === undefined ? [] : [lng]));
  const lats = ring.flatMap(([, lat]) => (lat === undefined ? [] : [lat]));
  return {
    north: Math.max(...lats),
    south: Math.min(...lats),
    east: Math.max(...lngs),
    west: Math.min(...lngs),
  };
}

/** Keeps a focused plot in the visible map: right of the side panel, or above the phone sheet. */
function plotFocusPadding() {
  if (window.matchMedia("(min-width: 640px)").matches) {
    return { top: 170, bottom: 60, left: 500, right: 80 };
  }
  return {
    top: 140,
    bottom: Math.round(window.innerHeight * 0.58) + 24,
    left: 40,
    right: 40,
  };
}

/** Box around the plots (padded so one plot isn't zoomed to street level). */
function plotsBounds(plots: ExplorePlot[]): MapBounds | null {
  if (!plots.length) return null;
  const lats = plots.map((plot) => plot.coordinates.lat);
  const lngs = plots.map((plot) => plot.coordinates.lng);
  const padding = 0.05;
  return {
    north: Math.max(...lats) + padding,
    south: Math.min(...lats) - padding,
    east: Math.max(...lngs) + padding,
    west: Math.min(...lngs) - padding,
  };
}

function toMapPlot(plot: ExplorePlot): MapPlot {
  return {
    id: plot.id,
    color: plotColor(plot.status, plot.isOwned),
    center: [plot.coordinates.lng, plot.coordinates.lat],
    polygon: plot.geometry?.coordinates,
    label: plot.plotNumber,
  };
}

/** The rest of the suggestion after what was typed, or "" if it doesn't start with it. */
function inlineCompletion(typed: string, suggestion: string | undefined) {
  if (!typed || !suggestion || typed.trimStart() !== typed) return "";
  return suggestion.toLowerCase().startsWith(typed.toLowerCase())
    ? suggestion.slice(typed.length)
    : "";
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <circle
        cx="10.8"
        cy="10.8"
        r="6.3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="m15.6 15.6 4.1 4.1"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function LocateIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 3v3M12 18v3M3 12h3M18 12h3"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

export function AuthenticatedExploreMapPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mapRef = useRef<MapboxMapHandle>(null);
  const searchAreaRef = useRef<HTMLDivElement>(null);
  const searchPanelRef = useRef<HTMLElement>(null);
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useDashboardLanguage();
  // Opened from a dashboard region card (`?regionId=…&region=Phuket`): start with
  // that region's plots, the same as picking it in search. Read once.
  const [linkedRegion] = useState(() => {
    const id = searchParams.get("regionId");
    const name = searchParams.get("region")?.trim();
    return id && name ? { id, name } : null;
  });
  const [search, setSearch] = useState(linkedRegion?.name ?? "");
  const [isSearchExpanded, setIsSearchExpanded] = useState(Boolean(linkedRegion));
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  // Applied values; they will drive the plot API once it is wired up.
  const [plotFilters, setPlotFilters] = useState<PlotFilters>(DEFAULT_PLOT_FILTERS);
  // Filter panel options (`/explore/filters`, loaded once).
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [filterOptionsStatus, setFilterOptionsStatus] = useState<
    "loading" | "ready" | "error"
  >("loading");
  const [filterOptionsReloadKey, setFilterOptionsReloadKey] = useState(0);
  // Sort panel options (`/explore/sort-options`, loaded once) and the applied one.
  const [sortOptions, setSortOptions] = useState<PlotSortOption[]>([]);
  const [sortOptionsStatus, setSortOptionsStatus] = useState<
    "loading" | "ready" | "error"
  >("loading");
  const [sortOptionsReloadKey, setSortOptionsReloadKey] = useState(0);
  // Null: the backend's default order.
  const [plotSortKey, setPlotSortKey] = useState<string | null>(null);
  const [searchMessage, setSearchMessage] = useState("");
  // Last suggestion lookup; only used while it still matches what is typed.
  const [suggestionLookup, setSuggestionLookup] = useState<{
    query: string;
    suggestions: SearchSuggestion[];
    failed: boolean;
  } | null>(null);
  // Results of the last submitted search; shown while the query still matches.
  const [searchResults, setSearchResults] = useState<{
    query: string;
    results: SearchResult[];
  } | null>(null);
  // Query of the search request in flight, if any.
  const [searchingQuery, setSearchingQuery] = useState<string | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);
  const searchTimerRef = useRef<number | undefined>(undefined);
  // Mirrors for the async search flow (state would be stale inside timers).
  const lastResultsRef = useRef<{ query: string; results: SearchResult[] } | null>(null);
  const inFlightQueryRef = useRef<string | null>(null);
  // Set by Enter / recent click: fly to the first result once that query's results arrive.
  const flyWhenReadyRef = useRef<string | null>(null);
  // Recent searches (backend history). `recentReloadKey` refetches them.
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [recentStatus, setRecentStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [recentReloadKey, setRecentReloadKey] = useState(0);
  const [showAllRecent, setShowAllRecent] = useState(false);
  // Last page loaded, and whether it came back full (so a next page may exist).
  const [recentPage, setRecentPage] = useState(1);
  const [recentHasMore, setRecentHasMore] = useState(false);
  const [isLoadingMoreRecent, setIsLoadingMoreRecent] = useState(false);
  // Error state: the map itself failed (nothing to show behind the dialog) or
  // its data failed after the map loaded (map stays visible behind it).
  const [mapStatus, setMapStatus] = useState<MapboxMapStatus>("loading");
  const [hasDataError, setHasDataError] = useState(false);
  const [isErrorDismissed, setIsErrorDismissed] = useState(false);
  // Bumped by "Try again": `mapKey` remounts a failed map, `reloadKey` refetches data.
  const [mapKey, setMapKey] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const hasMapError = mapStatus === "error" || hasDataError;
  // Area picked from search; its plots are drawn on the map (all statuses, no sort yet).
  const [plotScope, setPlotScope] = useState<PlotScope | null>(
    linkedRegion ? { param: "regionId", id: linkedRegion.id } : null,
  );
  const [plots, setPlots] = useState<ExplorePlot[]>([]);
  const [plotsReloadKey, setPlotsReloadKey] = useState(0);
  const [plotsStatus, setPlotsStatus] = useState<"idle" | "loading" | "ready" | "error">(
    linkedRegion ? "loading" : "idle",
  );
  // Name shown in the search box for the open area; the plot list shows while it matches.
  const [plotAreaName, setPlotAreaName] = useState(linkedRegion?.name ?? "");
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null);
  // Plot whose detail panel is open (replaces the list until closed).
  const [detailPlotId, setDetailPlotId] = useState<string | null>(null);
  // `GET /explore/plots/{plotId}` result for the open detail (matched by id).
  const [plotDetail, setPlotDetail] = useState<
    | { id: string; status: "loading" }
    | { id: string; status: "ready"; plot: ExplorePlotDetail }
    | { id: string; status: "error"; notFound: boolean }
    | null
  >(null);
  const [plotDetailReloadKey, setPlotDetailReloadKey] = useState(0);
  // Plots whose Add to Cart request is running (buttons show "Adding...").
  const [addingPlotIds, setAddingPlotIds] = useState<string[]>([]);
  const mapPlots = useMemo(() => plots.map(toMapPlot), [plots]);
  const { sortBy, sortOrder } =
    sortOptions.find((option) => option.key === plotSortKey)?.query ?? {};
  // Primitives, so the plots request reruns only when a param really changes.
  const { zoneId, minRai, maxRai, minPrice, maxPrice } = toPlotFilterQuery(plotFilters);
  const hasActiveFilters = [zoneId, minRai, maxRai, minPrice, maxPrice].some(
    (param) => param !== undefined,
  );
  // Set once the user moves the map, so late API data doesn't yank the camera back.
  const hasNavigatedRef = useRef(Boolean(linkedRegion));
  // Set when an area is opened without a known location (a recent search or a
  // dashboard link): fit the map to its plots once they load.
  const fitToPlotsRef = useRef(Boolean(linkedRegion));
  // Thailand's bounds from `/explore/map`; "clear" flies back to this start view.
  const initialBoundsRef = useRef<MapBounds>(THAILAND_BOUNDS);
  const selectedPlot = useMemo(() => {
    const plotId = searchParams.get("plotId");
    const latitude = Number(searchParams.get("lat"));
    const longitude = Number(searchParams.get("lng"));
    const zoom = Number(searchParams.get("zoom"));
    if (!plotId || !Number.isFinite(latitude) || !Number.isFinite(longitude))
      return undefined;
    return {
      id: plotId,
      coordinates: [longitude, latitude] as [number, number],
      zoom: Number.isFinite(zoom) ? zoom : 16,
    };
  }, [searchParams]);
  const hasSelectedPlot = Boolean(selectedPlot);

  useEffect(() => {
    if (!isAuthenticated) return;

    const controller = new AbortController();
    getExploreMap(controller.signal)
      .then(({ map }) => {
        initialBoundsRef.current = map.bounds;
        if (!hasSelectedPlot && !hasNavigatedRef.current) {
          mapRef.current?.fitBounds(map.bounds);
        }
      })
      .catch((error: unknown) => {
        // A cancelled request is not an error, and 401 already redirects to login.
        if (isAbortError(error)) return;
        if (isApiError(error) && error.code === "API_SESSION_EXPIRED") return;
        logError(error, "Failed to load Explore Map data");
        setHasDataError(true);
      });

    return () => controller.abort();
  }, [isAuthenticated, hasSelectedPlot, reloadKey]);

  useEffect(() => {
    if (!isAuthenticated || !plotScope) return;

    const controller = new AbortController();
    getPlotsInArea(
      plotScope,
      {
        sort: { sortBy, sortOrder },
        filters: { zoneId, minRai, maxRai, minPrice, maxPrice },
      },
      controller.signal,
    )
      .then((items) => {
        setPlots(items);
        setPlotsStatus("ready");
        if (fitToPlotsRef.current) {
          fitToPlotsRef.current = false;
          const bounds = plotsBounds(items);
          if (bounds) mapRef.current?.fitBounds(bounds, { duration: 1200 });
        }
      })
      .catch((error: unknown) => {
        if (isAbortError(error)) return;
        if (isApiError(error) && error.code === "API_SESSION_EXPIRED") return;
        logError(error, "Failed to load plots");
        setPlots([]);
        setPlotsStatus("error");
        setSearchMessage("Couldn't load plots for this area. Please try again.");
        setIsSearchExpanded(true);
      });

    return () => controller.abort();
  }, [
    isAuthenticated,
    plotScope,
    plotsReloadKey,
    sortBy,
    sortOrder,
    zoneId,
    minRai,
    maxRai,
    minPrice,
    maxPrice,
  ]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const controller = new AbortController();
    getFilterOptions(controller.signal)
      .then((options) => {
        setFilterOptions(options);
        setFilterOptionsStatus("ready");
      })
      .catch((error: unknown) => {
        if (isAbortError(error)) return;
        if (isApiError(error) && error.code === "API_SESSION_EXPIRED") return;
        logError(error, "Failed to load filter options");
        setFilterOptionsStatus("error");
      });

    return () => controller.abort();
  }, [isAuthenticated, filterOptionsReloadKey]);

  function retryFilterOptions() {
    setFilterOptionsStatus("loading");
    setFilterOptionsReloadKey((key) => key + 1);
  }

  // Reloads the open area's plots when a sent param changes (the effect above refetches).
  function applyFilters(next: PlotFilters) {
    const changed =
      JSON.stringify(toPlotFilterQuery(next)) !==
      JSON.stringify(toPlotFilterQuery(plotFilters));
    setPlotFilters(next);
    if (changed && plotScope) setPlotsStatus("loading");
  }

  useEffect(() => {
    if (!isAuthenticated) return;

    const controller = new AbortController();
    getSortOptions(controller.signal)
      .then((options) => {
        setSortOptions(options);
        setSortOptionsStatus("ready");
      })
      .catch((error: unknown) => {
        if (isAbortError(error)) return;
        if (isApiError(error) && error.code === "API_SESSION_EXPIRED") return;
        logError(error, "Failed to load sort options");
        setSortOptionsStatus("error");
      });

    return () => controller.abort();
  }, [isAuthenticated, sortOptionsReloadKey]);

  function retrySortOptions() {
    setSortOptionsStatus("loading");
    setSortOptionsReloadKey((key) => key + 1);
  }

  // Reloads the open area's plots in the new order (the effect above refetches).
  function applySort(key: string | null) {
    if (key === plotSortKey) return;
    setPlotSortKey(key);
    if (plotScope) setPlotsStatus("loading");
  }

  useEffect(() => {
    if (!isAuthenticated || !detailPlotId) return;

    // Switching plots aborts the previous request, so a late reply never shows the wrong plot.
    const controller = new AbortController();
    getPlotDetail(detailPlotId, controller.signal)
      .then((plot) => setPlotDetail({ id: detailPlotId, status: "ready", plot }))
      .catch((error: unknown) => {
        if (isAbortError(error)) return;
        if (isApiError(error) && error.code === "API_SESSION_EXPIRED") return;
        const notFound = isApiError(error) && error.status === 404;
        if (!notFound) logError(error, "Failed to load plot details");
        setPlotDetail({ id: detailPlotId, status: "error", notFound });
      });

    return () => controller.abort();
  }, [isAuthenticated, detailPlotId, plotDetailReloadKey]);

  // Fly to a place and show its plots.
  function openPlace(place: SearchResult) {
    const scope = plotScopeFor(place);
    if (!scope) {
      flyToPlace(place);
      return;
    }
    // The area's plots (with their labels) mark it, so fly without a pin that would cover them.
    hasNavigatedRef.current = true;
    mapRef.current?.clearMarker();
    void mapRef.current?.flyToView({
      center: [place.location.lng, place.location.lat],
      zoom: PLACE_ZOOM[place.type.toUpperCase()] ?? 11,
      duration: 1500,
    });
    showAreaPlots(scope, place.name);
    rememberPlace(place);
    // Show the full place name ("pat" -> "Pattaya"). Not scheduled as a search,
    // so it isn't sent (or auto-saved) again.
    window.clearTimeout(searchTimerRef.current);
    setSearch(place.name);
  }

  function showAreaPlots(scope: PlotScope, name: string) {
    setPlotsStatus("loading");
    setPlotAreaName(name);
    setSelectedPlotId(null);
    setDetailPlotId(null);
    // Same area again (e.g. after an error): refetch instead of skipping.
    if (plotScope?.param === scope.param && plotScope.id === scope.id) {
      setPlotsReloadKey((key) => key + 1);
    } else {
      setPlots([]);
      setPlotScope(scope);
    }
  }

  // Saves the picked place to recent searches. Best effort: a failure only logs.
  function rememberPlace(place: SearchResult) {
    const type = place.type.toUpperCase();
    saveRecentSearch({
      query: place.name,
      type: type === "REGION" || type === "CITY" ? type : "LOCATION",
      referenceId: place.id,
    })
      .then(() => setRecentReloadKey((key) => key + 1))
      .catch((error: unknown) => {
        if (isApiError(error) && error.code === "API_SESSION_EXPIRED") return;
        logError(error, "Failed to save recent search");
      });
  }

  function retryMap() {
    setIsErrorDismissed(false);
    setHasDataError(false);
    if (mapStatus === "error") setMapKey((key) => key + 1);
    setReloadKey((key) => key + 1);
  }

  useEffect(() => {
    if (!isSearchExpanded) return;

    function handleOutsidePointer(event: PointerEvent) {
      // The results panel is a sibling of the search bar, so it counts as inside too.
      const target = event.target as Node;
      if (
        !searchAreaRef.current?.contains(target) &&
        !searchPanelRef.current?.contains(target)
      ) {
        setIsSearchExpanded(false);
        setIsFilterOpen(false);
        setIsSortOpen(false);
        setShowAllRecent(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsSearchExpanded(false);
        setIsFilterOpen(false);
        setIsSortOpen(false);
        setShowAllRecent(false);
      }
    }

    document.addEventListener("pointerdown", handleOutsidePointer);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handleOutsidePointer);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isSearchExpanded]);

  function flyToPlace(place: {
    type: string;
    name: string;
    location: { lat: number; lng: number };
  }) {
    hasNavigatedRef.current = true;
    mapRef.current?.flyToCoordinates(
      [place.location.lng, place.location.lat],
      PLACE_ZOOM[place.type.toUpperCase()] ?? 11,
      place.name,
    );
  }

  // Keeps the panel open: it switches to the area's plot list.
  function selectResult(result: SearchResult) {
    openPlace(result);
    setIsFilterOpen(false);
    setIsSortOpen(false);
  }

  const trimmedSearch = search.trim();
  // An area is open and the box still shows its name (typing something else goes back to search).
  const showPlotList =
    plotScope !== null && trimmedSearch === plotAreaName && !hasMapError;

  // Zoom the map to fit the plot's outline (its centre at a fixed zoom if it has none).
  function focusPlot(plot: Pick<ExplorePlot, "coordinates" | "geometry">) {
    hasNavigatedRef.current = true;
    const bounds = polygonBounds(plot);
    if (bounds) {
      mapRef.current?.fitBounds(bounds, {
        padding: plotFocusPadding(),
        maxZoom: PLOT_FOCUS_MAX_ZOOM,
        duration: 1200,
      });
      return;
    }
    void mapRef.current?.flyToView({
      center: [plot.coordinates.lng, plot.coordinates.lat],
      zoom: 15,
      duration: 1200,
    });
  }

  // Card or map click: select the plot, zoom to it and open its detail.
  function openPlotDetail(plot: ExplorePlot) {
    setSelectedPlotId(plot.id);
    if (plot.id !== detailPlotId) {
      setPlotDetail({ id: plot.id, status: "loading" });
      setDetailPlotId(plot.id);
    }
    setIsSearchExpanded(true);
    focusPlot(plot);
  }

  // `POST /cart/items` (the backend reserves the plot itself), then mark it in
  // the list and the open detail, and tell the navbar badge to reload.
  async function addToCart(plotId: string) {
    if (addingPlotIds.includes(plotId)) return;
    setAddingPlotIds((ids) => [...ids, plotId]);
    setSearchMessage("");
    try {
      await addPlotToCart(plotId);
      setPlots((current) =>
        current.map((plot) => (plot.id === plotId ? { ...plot, isInCart: true } : plot)),
      );
      setPlotDetail((current) =>
        current?.status === "ready" && current.id === plotId
          ? { ...current, plot: { ...current.plot, isInCart: true } }
          : current,
      );
      notifyCartChanged();
    } catch (error) {
      if (isApiError(error) && error.code === "API_SESSION_EXPIRED") return;
      const notFound = isApiError(error) && error.status === 404;
      const conflict = isApiError(error) && error.status === 409;
      if (!notFound && !conflict) logError(error, "Failed to add plot to cart");
      showSearchMessage(
        notFound
          ? "This plot is no longer available."
          : conflict
            ? "This plot just became unavailable."
            : "Couldn't add to cart. Please try again.",
      );
      // Someone else took it: refresh the list so its status is current.
      if (conflict) setPlotsReloadKey((key) => key + 1);
    } finally {
      setAddingPlotIds((ids) => ids.filter((id) => id !== plotId));
    }
  }

  function retryPlotDetail() {
    if (!detailPlotId) return;
    setPlotDetail({ id: detailPlotId, status: "loading" });
    setPlotDetailReloadKey((key) => key + 1);
  }

  function handleMapPlotClick(plotId: string) {
    const plot = plots.find((item) => item.id === plotId);
    if (plot) openPlotDetail(plot);
  }

  // Only the open plot's own result counts (a stale one shows the skeleton).
  const openDetail = plotDetail?.id === detailPlotId ? plotDetail : null;
  const currentSuggestions =
    suggestionLookup?.query === trimmedSearch && !suggestionLookup.failed
      ? suggestionLookup.suggestions
      : null;
  const searchCompletion = inlineCompletion(search, currentSuggestions?.[0]?.name);

  // Autocomplete: debounced, and a newer keystroke cancels the older request.
  useEffect(() => {
    const query = search.trim();
    if (query.length < MIN_SUGGESTION_QUERY_LENGTH) return;

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      getSearchSuggestions(query, controller.signal)
        .then((suggestions) => setSuggestionLookup({ query, suggestions, failed: false }))
        .catch((error: unknown) => {
          if (isAbortError(error)) return;
          if (isApiError(error) && error.code === "API_SESSION_EXPIRED") return;
          // No inline hint on failure; pressing Enter retries and shows a message.
          logError(error, "Failed to load search suggestions");
          setSuggestionLookup({ query, suggestions: [], failed: true });
        });
    }, SUGGESTION_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [search]);

  function acceptCompletion() {
    const suggestion = currentSuggestions?.[0];
    if (!searchCompletion || !suggestion) return false;
    // Use the API's spelling, e.g. "phu" + Tab -> "Phuket".
    setSearch(suggestion.name);
    scheduleSearch(suggestion.name);
    return true;
  }

  // The message lives in the search panel, so make sure the panel is open to show it.
  function showSearchMessage(message: string) {
    setSearchMessage(message);
    setIsSearchExpanded(true);
  }

  const currentResults =
    searchResults?.query === trimmedSearch ? searchResults.results : null;
  const isSearching = searchingQuery !== null && searchingQuery === trimmedSearch;

  // Stop a pending or running search when the page goes away.
  useEffect(
    () => () => {
      window.clearTimeout(searchTimerRef.current);
      searchAbortRef.current?.abort();
    },
    [],
  );

  useEffect(() => {
    if (!isAuthenticated) return;

    const controller = new AbortController();
    // A reload (after a save, delete or retry) starts again from the first page.
    getRecentSearches(1, controller.signal)
      .then((items) => {
        setRecentSearches(items);
        setRecentPage(1);
        setRecentHasMore(items.length === RECENT_SEARCH_PAGE_SIZE);
        setRecentStatus("ready");
      })
      .catch((error: unknown) => {
        if (isAbortError(error)) return;
        if (isApiError(error) && error.code === "API_SESSION_EXPIRED") return;
        logError(error, "Failed to load recent searches");
        setRecentStatus("error");
      });

    return () => controller.abort();
  }, [isAuthenticated, recentReloadKey]);

  function retryRecentSearches() {
    setRecentStatus("loading");
    setRecentReloadKey((key) => key + 1);
  }

  // Only places the user picked (saved with a `referenceId`). `/explore/search`
  // still auto-saves half-typed text like "phu"; those entries are hidden.
  // Duplicates stay, as the API sends them.
  const recentPlaces = recentSearches.filter((item) => item.referenceId);
  // "More": first show the rest of what's loaded; call the API only when it's all shown.
  const canShowMoreLoaded = !showAllRecent && recentPlaces.length > RECENT_PREVIEW_COUNT;
  const canLoadMoreRecent = !canShowMoreLoaded && recentHasMore;
  const visibleRecent = showAllRecent
    ? recentPlaces
    : recentPlaces.slice(0, RECENT_PREVIEW_COUNT);

  // Known place: fly straight there. Older entries only have the text, so search it again.
  function selectRecent(item: RecentSearch) {
    // Saved from a click: open that region/city directly (no search, so nothing new is saved).
    const type = item.type.toUpperCase();
    if (item.referenceId && (type === "REGION" || type === "CITY")) {
      hasNavigatedRef.current = true;
      mapRef.current?.clearMarker();
      fitToPlotsRef.current = true;
      showAreaPlots(
        { param: type === "REGION" ? "regionId" : "cityId", id: item.referenceId },
        item.query,
      );
      setSearch(item.query);
      return;
    }
    if (item.location) {
      flyToPlace({
        type: item.type,
        name: item.name ?? item.query,
        location: item.location,
      });
      setIsSearchExpanded(false);
      return;
    }
    setSearch(item.query);
    window.clearTimeout(searchTimerRef.current);
    void runSearch(item.query, true);
  }

  function handleRecentFailure(error: unknown) {
    if (isApiError(error) && error.code === "API_SESSION_EXPIRED") return;
    logError(error, "Failed to update recent searches");
    showSearchMessage("Couldn't update recent searches. Please try again.");
    // Reload so the list matches the server again.
    setRecentReloadKey((key) => key + 1);
  }

  async function removeRecent(item: RecentSearch) {
    setRecentSearches((current) => current.filter((entry) => entry.id !== item.id));
    try {
      await deleteRecentSearch(item.id);
    } catch (error) {
      // Already gone (deleted elsewhere, or a stale list): the user got what they
      // wanted, so just resync instead of showing an error.
      if (isApiError(error) && /not found/i.test(error.message)) {
        setRecentReloadKey((key) => key + 1);
        return;
      }
      handleRecentFailure(error);
    }
  }

  // Loads the next page (10) and adds it below what's shown.
  async function loadMoreRecent() {
    const nextPage = recentPage + 1;
    setIsLoadingMoreRecent(true);
    try {
      const items = await getRecentSearches(nextPage);
      setRecentSearches((current) => [...current, ...items]);
      setRecentPage(nextPage);
      setRecentHasMore(items.length === RECENT_SEARCH_PAGE_SIZE);
      setShowAllRecent(true);
    } catch (error) {
      if (isApiError(error) && error.code === "API_SESSION_EXPIRED") return;
      logError(error, "Failed to load more recent searches");
      showSearchMessage("Couldn't load more recent searches. Please try again.");
    } finally {
      setIsLoadingMoreRecent(false);
    }
  }

  async function clearAllRecent() {
    setRecentSearches([]);
    setShowAllRecent(false);
    setRecentPage(1);
    setRecentHasMore(false);
    try {
      await clearRecentSearches();
    } catch (error) {
      handleRecentFailure(error);
    }
  }

  function flyToFirstResult(results: SearchResult[]) {
    const [first] = results;
    if (first) {
      openPlace(first);
    } else {
      showSearchMessage("Please search for locations within Thailand.");
    }
  }

  // Full search. Typing calls it (debounced) to list results; Enter and recent
  // searches pass `fly` to also move the map to the best match.
  async function runSearch(rawQuery: string, fly: boolean) {
    const query = rawQuery.trim();
    if (query.length < MIN_SUGGESTION_QUERY_LENGTH) {
      if (fly) showSearchMessage("Type at least 2 characters to search.");
      return;
    }

    // Reuse what we already have so one query is never sent (and saved) twice.
    const cached = lastResultsRef.current;
    if (cached?.query === query) {
      if (fly) flyToFirstResult(cached.results);
      return;
    }
    if (inFlightQueryRef.current === query) {
      if (fly) flyWhenReadyRef.current = query;
      return;
    }

    searchAbortRef.current?.abort();
    const controller = new AbortController();
    searchAbortRef.current = controller;
    inFlightQueryRef.current = query;
    flyWhenReadyRef.current = fly ? query : null;
    setSearchingQuery(query);
    setSearchMessage("");

    try {
      const results = await searchPlaces(query, controller.signal);
      lastResultsRef.current = { query, results };
      setSearchResults({ query, results });
      if (flyWhenReadyRef.current === query) {
        flyWhenReadyRef.current = null;
        flyToFirstResult(results);
      }
    } catch (error) {
      // A newer search replaced this one, or 401 already redirected to login.
      if (isAbortError(error)) return;
      if (isApiError(error) && error.code === "API_SESSION_EXPIRED") return;
      logError(error, "Search failed");
      showSearchMessage("Unable to search right now. Please try again.");
    } finally {
      if (searchAbortRef.current === controller) {
        searchAbortRef.current = null;
        inFlightQueryRef.current = null;
        setSearchingQuery(null);
      }
    }
  }

  // Called on every edit: search after the user pauses typing.
  function scheduleSearch(value: string) {
    window.clearTimeout(searchTimerRef.current);
    if (value.trim().length < MIN_SUGGESTION_QUERY_LENGTH) {
      // Too short (or cleared): drop any request that is still running.
      searchAbortRef.current?.abort();
      return;
    }
    searchTimerRef.current = window.setTimeout(() => {
      void runSearch(value, false);
    }, SEARCH_DEBOUNCE_MS);
  }

  if (isLoading)
    return (
      <main className="flex min-h-[100svh] items-center justify-center bg-white text-sm text-muted">
        {t("Loading map...")}
      </main>
    );
  if (!isAuthenticated) {
    router.replace(routes.login);
    return null;
  }

  return (
    <main
      className={`relative min-h-[100svh] overflow-hidden text-navy ${mapStatus === "error" ? "bg-[#eef3f6]" : "bg-[#74d0e1]"}`}
    >
      <MapboxMap
        key={mapKey}
        ref={mapRef}
        className="absolute inset-0"
        selectedLocation={selectedPlot}
        onStatusChange={setMapStatus}
        showErrorOverlay={false}
        // Centre the loading card in the map left visible: right of the open
        // search panel (sm up), or between the search bar and the plot list's
        // bottom sheet (phones).
        loadingOverlayClassName={
          isSearchExpanded
            ? showPlotList
              ? "max-sm:pb-[58svh] max-sm:pt-32 sm:pl-[calc(2rem+420px)]"
              : "sm:pl-[calc(2rem+304px)]"
            : undefined
        }
        loadingLabels={{
          title: t("Loading Map"),
          subtitle: t("Preparing Thailand for exploration..."),
        }}
        plots={mapPlots}
        onPlotClick={handleMapPlotClick}
      />

      {hasMapError && !isErrorDismissed ? (
        // Centred on screen; from sm up it slides right of the search panel while
        // that is open, matching the search box's 300ms width transition.
        <div
          className={`pointer-events-none absolute inset-0 z-30 flex items-center justify-center px-4 transition-[padding] duration-300 ease-out motion-reduce:transition-none ${isSearchExpanded ? "sm:pl-[calc(2rem+304px+1rem)]" : ""}`}
        >
          {/* Container query: the dialog adapts to the room left beside the panel. */}
          <div className="pointer-events-auto flex w-full justify-center @container">
            <MapErrorDialog
              onContinue={() => setIsErrorDismissed(true)}
              onRetry={retryMap}
              t={t}
            />
          </div>
        </div>
      ) : null}

      <DashboardNavbar active="explore" overlay />

      <div
        ref={searchAreaRef}
        className="absolute inset-x-4 top-20 z-20 flex items-start gap-2 sm:inset-x-auto sm:left-8 sm:top-24"
        onMouseEnter={() => setIsSearchExpanded(true)}
      >
        <label
          className={`flex h-11 min-w-0 flex-1 items-center gap-2 rounded-[10px] bg-white/95 px-4 text-[12px] text-[#aab2bd] shadow-[0_3px_12px_rgba(11,31,77,0.12)] transition-[width] duration-300 sm:flex-none ${isSearchExpanded ? (showPlotList ? "sm:w-[420px]" : "sm:w-[300px]") : "sm:w-[150px]"}`}
        >
          <span className="sr-only">{t("Search Maps")}</span>
          <span className="relative flex min-w-0 flex-1 items-center">
            {searchCompletion ? (
              // Ghost text: the typed part is invisible so the rest lines up after it.
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 flex items-center overflow-hidden whitespace-pre"
              >
                <span className="invisible">{search}</span>
                <span className="text-[#aab2bd]">{searchCompletion}</span>
              </span>
            ) : null}
            <input
              type="search"
              value={search}
              aria-autocomplete="inline"
              onFocus={() => setIsSearchExpanded(true)}
              onChange={(event) => {
                setSearchMessage("");
                setSearch(event.target.value);
                scheduleSearch(event.target.value);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  // Search now instead of waiting for the debounce, then fly.
                  window.clearTimeout(searchTimerRef.current);
                  void runSearch(search, true);
                  return;
                }
                const atEnd = event.currentTarget.selectionStart === search.length;
                if (
                  (event.key === "Tab" || (event.key === "ArrowRight" && atEnd)) &&
                  acceptCompletion()
                ) {
                  event.preventDefault();
                }
              }}
              placeholder={t("Search Maps")}
              className="relative w-full min-w-0 bg-transparent text-[#001f54] outline-none placeholder:text-[#aab2bd] [&::-webkit-search-cancel-button]:hidden"
            />
          </span>
          <SearchIcon />
          {search || plotScope ? (
            <button
              type="button"
              aria-label={t("Clear search")}
              // In a plot's detail: back to the area's list. Otherwise clears the
              // text and the area's plots it put on the map.
              onClick={() => {
                if (detailPlotId) {
                  setDetailPlotId(null);
                  return;
                }
                setSearch("");
                scheduleSearch("");
                setSearchMessage("");
                setPlotScope(null);
                setIsFilterOpen(false);
                setIsSortOpen(false);
                setPlots([]);
                setPlotsStatus("idle");
                setPlotAreaName("");
                setSelectedPlotId(null);
                // Back to the view the page opened with.
                mapRef.current?.clearMarker();
                mapRef.current?.fitBounds(initialBoundsRef.current, { duration: 1200 });
                hasNavigatedRef.current = false;
              }}
              className="cursor-pointer text-lg leading-none text-[#8c96a3]"
            >
              ×
            </button>
          ) : null}
        </label>
        {/* Filter and Sort act on an area's plots, so they show once one is open. */}
        {isSearchExpanded && plotScope ? (
          <>
            <div className="relative">
              <button
                type="button"
                aria-expanded={isFilterOpen}
                onClick={() => {
                  setIsFilterOpen((open) => !open);
                  setIsSortOpen(false);
                }}
                aria-label={t("Filter")}
                className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center gap-1 rounded-[10px] bg-white/95 text-[12px] text-[#6d7784] shadow-[0_3px_12px_rgba(11,31,77,0.12)] sm:w-auto sm:px-3"
              >
                <span aria-hidden="true">☷</span>
                <span className="hidden sm:inline">{t("Filter")}</span>
              </button>
              {isFilterOpen ? (
                <FilterPlotsPanel
                  value={plotFilters}
                  options={filterOptions}
                  status={filterOptionsStatus}
                  onRetry={retryFilterOptions}
                  totalPlots={exploreFiltersMock.totalPlots}
                  matchingPlots={exploreFiltersMock.matchingPlots}
                  onApply={applyFilters}
                  onClose={() => setIsFilterOpen(false)}
                  t={t}
                />
              ) : null}
            </div>
            <div className="relative">
              <button
                type="button"
                aria-expanded={isSortOpen}
                onClick={() => {
                  setIsSortOpen((open) => !open);
                  setIsFilterOpen(false);
                }}
                aria-label={t("Sort")}
                className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center gap-1 rounded-[10px] bg-white/95 text-[12px] text-[#6d7784] shadow-[0_3px_12px_rgba(11,31,77,0.12)] sm:w-auto sm:px-3"
              >
                <span aria-hidden="true">↕</span>
                <span className="hidden sm:inline">{t("Sort")}</span>
              </button>
              {isSortOpen ? (
                <SortPlotsPanel
                  options={sortOptions}
                  status={sortOptionsStatus}
                  onRetry={retrySortOptions}
                  value={plotSortKey}
                  onApply={applySort}
                  onClose={() => setIsSortOpen(false)}
                  t={t}
                />
              ) : null}
            </div>
          </>
        ) : null}
      </div>

      {isSearchExpanded ? (
        <section
          ref={searchPanelRef}
          className={
            showPlotList
              ? // Phones: bottom sheet so the map stays visible. From sm: Figma
                // "list of plots" panel (420 wide, radius 24), 16px below the search box and
                // 16px above the screen bottom; scrolls inside.
                "fixed inset-x-0 bottom-0 z-30 flex h-[58svh] flex-col overflow-hidden rounded-t-[24px] bg-white shadow-[0_-8px_24px_rgba(0,0,0,0.12)] sm:absolute sm:inset-x-auto sm:bottom-auto sm:left-8 sm:top-[156px] sm:z-10 sm:h-[calc(100svh-172px)] sm:w-[420px] sm:rounded-[24px] sm:shadow-[2px_0_20px_rgba(0,0,0,0.08)]"
              : `absolute inset-x-4 top-32 z-10 flex max-h-[calc(100svh-12rem)] flex-col sm:inset-x-auto sm:w-[304px] overflow-hidden rounded-[18px] bg-white/95 p-4 shadow-[0_5px_20px_rgba(11,31,77,0.14)] sm:left-8 sm:top-36 ${hasMapError ? "h-[calc(100svh-15rem)]" : ""} ${
                  // Phones: the error dialog would sit on top of this panel, so
                  // hide it until "Continue" (it then shows "Map unavailable").
                  hasMapError && !isErrorDismissed ? "max-sm:hidden" : ""
                }`
          }
        >
          {showPlotList ? (
            <>
              {/* Grab handle look for the phone bottom sheet. */}
              <span
                aria-hidden="true"
                className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-[#d9e1ea] sm:hidden"
              />
              <div
                // New key per view, so opening a detail (or going back) starts at the top.
                key={detailPlotId ?? "plot-list"}
                // The detail lays out its own padding so its image can sit edge to edge.
                className={`flex min-h-0 flex-1 flex-col overflow-y-auto ${detailPlotId ? "" : "gap-[14px] px-4 pb-6 pt-4 sm:py-6"} ${SLIM_SCROLLBAR}`}
                aria-live="polite"
                aria-label={t("Plots")}
              >
                {searchMessage ? (
                  <p className="px-2 py-3 text-center text-[11px] text-[#b42318]">
                    {t(searchMessage)}
                  </p>
                ) : null}
                {detailPlotId ? (
                  openDetail?.status === "ready" ? (
                    <PlotDetailPanel
                      plot={openDetail.plot}
                      onFocusPlot={() => focusPlot(openDetail.plot)}
                      isAddingToCart={addingPlotIds.includes(openDetail.plot.id)}
                      onAddToCart={() => void addToCart(openDetail.plot.id)}
                      t={t}
                    />
                  ) : openDetail?.status === "error" ? (
                    <PlotDetailError
                      notFound={openDetail.notFound}
                      onRetry={retryPlotDetail}
                      onBack={() => setDetailPlotId(null)}
                      t={t}
                    />
                  ) : (
                    <PlotDetailSkeleton t={t} />
                  )
                ) : plotsStatus === "loading" ? (
                  <div
                    role="status"
                    aria-label={t("Loading plots...")}
                    className="flex flex-col gap-[14px]"
                  >
                    {Array.from({ length: PLOT_SKELETON_COUNT }, (_, index) => (
                      <PlotCardSkeleton key={index} />
                    ))}
                  </div>
                ) : plotsStatus === "ready" && !plots.length ? (
                  <p className="px-2 py-8 text-center text-[11px] text-[#8d97a3]">
                    {t(
                      hasActiveFilters
                        ? "No plots match these filters."
                        : "No plots in this area yet.",
                    )}
                  </p>
                ) : (
                  plots.map((plot) => (
                    <PlotCard
                      key={plot.id}
                      plot={plot}
                      selected={plot.id === selectedPlotId}
                      onSelect={openPlotDetail}
                      isAddingToCart={addingPlotIds.includes(plot.id)}
                      onAddToCart={(item) => void addToCart(item.id)}
                      t={t}
                    />
                  ))
                )}
              </div>
            </>
          ) : hasMapError ? (
            <MapUnavailableState onRetry={retryMap} t={t} />
          ) : (
            <>
              <div
                className={`min-h-0 overflow-y-auto pr-1 ${SLIM_SCROLLBAR}`}
                aria-live="polite"
              >
                {searchMessage && !isSearching ? (
                  <p className="px-2 py-3 text-center text-[11px] text-[#b42318]">
                    {t(searchMessage)}
                  </p>
                ) : null}
                {isSearching ? (
                  <p className="px-2 py-8 text-center text-[11px] text-[#8d97a3]">
                    {t("Searching...")}
                  </p>
                ) : currentResults ? (
                  currentResults.length ? (
                    <ul aria-label={t("Search results")}>
                      {currentResults.map((result) => (
                        <li key={`${result.type}-${result.id}`}>
                          <SearchResultRow
                            result={result}
                            onSelect={selectResult}
                            t={t}
                          />
                        </li>
                      ))}
                    </ul>
                  ) : searchMessage ? null : (
                    <p className="px-2 py-8 text-center text-[11px] text-[#8d97a3]">
                      {t("No places match your search.")}
                    </p>
                  )
                ) : recentStatus === "loading" ? (
                  <p className="px-2 py-8 text-center text-[11px] text-[#8d97a3]">
                    {t("Loading recent searches...")}
                  </p>
                ) : recentStatus === "error" ? (
                  <div className="flex flex-col items-center gap-2 px-2 py-8 text-center">
                    <p className="text-[11px] text-[#8d97a3]">
                      {t("Couldn't load recent searches.")}
                    </p>
                    <button
                      type="button"
                      onClick={retryRecentSearches}
                      className="cursor-pointer text-[11px] font-semibold text-[#001f54] underline underline-offset-2"
                    >
                      {t("Try again")}
                    </button>
                  </div>
                ) : visibleRecent.length ? (
                  <ul aria-label={t("Recent searches")}>
                    {visibleRecent.map((item) => (
                      <li key={item.id}>
                        <RecentSearchRow
                          item={item}
                          onSelect={selectRecent}
                          onRemove={(entry) => void removeRecent(entry)}
                          t={t}
                        />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-2 py-8 text-center text-[11px] text-[#8d97a3]">
                    {t("Search for a region, city or zone.")}
                  </p>
                )}
              </div>
              {!isSearching && !currentResults && recentPlaces.length ? (
                <div className="-mx-4 mt-3 flex h-[30px] shrink-0 items-center justify-between gap-3 rounded-[6px] px-5 py-[5px] text-[14px] leading-5">
                  {canShowMoreLoaded || canLoadMoreRecent ? (
                    <button
                      type="button"
                      disabled={isLoadingMoreRecent}
                      onClick={() =>
                        canShowMoreLoaded ? setShowAllRecent(true) : void loadMoreRecent()
                      }
                      className="cursor-pointer truncate text-[#001f54] hover:underline disabled:cursor-wait disabled:opacity-60"
                    >
                      {t(isLoadingMoreRecent ? "Loading..." : "More from recent history")}
                    </button>
                  ) : showAllRecent && recentPlaces.length > RECENT_PREVIEW_COUNT ? (
                    <button
                      type="button"
                      onClick={() => setShowAllRecent(false)}
                      className="cursor-pointer truncate text-[#001f54] hover:underline"
                    >
                      {t("Show less")}
                    </button>
                  ) : (
                    <p className="truncate text-[#001f54]">
                      {t("More from recent history")}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => void clearAllRecent()}
                    className="cursor-pointer shrink-0 text-[#6b7785] underline underline-offset-2 hover:text-[#001f54]"
                  >
                    {t("Clear All")}
                  </button>
                </div>
              ) : null}
            </>
          )}
        </section>
      ) : null}

      {/* Hidden under the open plot list (as in Figma); the cards show each status. */}
      <div
        className={`absolute bottom-9 left-5 flex max-w-[calc(100%-6rem)] flex-wrap items-center gap-3 rounded-md bg-white/95 px-3 py-2 text-[9px] text-[#273044] shadow-[0_3px_12px_rgba(11,31,77,0.12)] sm:bottom-10 sm:left-8 sm:max-w-none ${showPlotList && isSearchExpanded ? "hidden" : ""}`}
      >
        <span className="font-medium uppercase tracking-wide">{t("Plot Status")}</span>
        <span className="flex items-center gap-1">
          <i className="h-1.5 w-1.5 rounded-full bg-[#2cbf65]" />
          {t("Available")}
        </span>
        <span className="flex items-center gap-1">
          <i className="h-1.5 w-1.5 rounded-full bg-[#e7b52c]" />
          {t("Locked")}
        </span>
        <span className="flex items-center gap-1">
          <i className="h-1.5 w-1.5 rounded-full bg-[#d64242]" />
          {t("Taken")}
        </span>
        <span className="hidden items-center gap-1 sm:flex">
          <i className="h-1.5 w-1.5 rounded-full bg-navy" />
          {t("Your plots")}
        </span>
      </div>

      <div className="absolute bottom-9 right-5 flex flex-col items-center gap-3 sm:bottom-10 sm:right-8">
        <button
          type="button"
          aria-label={t("Current location")}
          onClick={() => {
            hasNavigatedRef.current = true;
            mapRef.current?.locate();
          }}
          className="cursor-pointer flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-[0_3px_12px_rgba(11,31,77,0.12)]"
        >
          <LocateIcon />
        </button>
        <div className="flex flex-col overflow-hidden rounded-full bg-white/95 shadow-[0_3px_12px_rgba(11,31,77,0.12)]">
          <button
            type="button"
            aria-label={t("Zoom in")}
            onClick={() => mapRef.current?.zoomIn()}
            className="cursor-pointer flex h-9 w-9 items-center justify-center hover:bg-[#f4f7fa]"
          >
            +
          </button>
          <span className="mx-auto h-px w-4 bg-line" />
          <button
            type="button"
            aria-label={t("Zoom out")}
            onClick={() => mapRef.current?.zoomOut()}
            className="cursor-pointer flex h-9 w-9 items-center justify-center hover:bg-[#f4f7fa]"
          >
            −
          </button>
        </div>
      </div>
    </main>
  );
}
