"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { isAbortError } from "@/lib/api/browser-client";
import { isApiError } from "@/lib/api/errors";
import { applyCartChange } from "@/lib/cart/cart-snapshot";
import { routes } from "@/lib/constants/routes";
import { logError } from "@/lib/logging/logger";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  MapboxMap,
  type MapboxMapHandle,
  type MapboxMapStatus,
  type MapPlot,
  type MapRegion,
  type MapView,
} from "@/components/maps/MapboxMap";
import { regionImageSrc } from "@/lib/config/remote-images";
import { useDashboardLanguage } from "@/modules/dashboard/DashboardLanguageContext";
import { PageLoader } from "@/components/ui/PageLoader";
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
import { OWNED_PLOT_FILL, PLOT_STATUS_COLORS, plotColor } from "./constants/plot-status";
import {
  addPlotToCart,
  clearRecentSearches,
  deleteRecentSearch,
  getExploreMap,
  getPlotDeedOrderId,
  getRecentSearches,
  RECENT_SEARCH_PAGE_SIZE,
  saveRecentSearch,
  getSearchSuggestions,
  MIN_SUGGESTION_QUERY_LENGTH,
  countPlotsInArea,
  getFilterOptions,
  getPlotDetail,
  getPlotsInArea,
  getPlotsInViewport,
  MAX_VIEWPORT_DEGREES,
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
// Thailand-wide view: room for the search bar on top and the status legend at
// the bottom, so no region pin (Chiang Mai, Phuket) sits under them.
const THAILAND_VIEW_PADDING = { top: 160, bottom: 80, left: 40, right: 40 };
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

// From sm up the list is a 340px panel over the left of the map.
const PANEL_WIDTH = 340;

function isSmUp() {
  return window.matchMedia("(min-width: 640px)").matches;
}

/** The Thailand-wide view, leaving the panel's part of the map out when it is open. */
function thailandViewPadding(panelOpen: boolean) {
  return panelOpen && isSmUp()
    ? { ...THAILAND_VIEW_PADDING, left: THAILAND_VIEW_PADDING.left + PANEL_WIDTH }
    : THAILAND_VIEW_PADDING;
}

/**
 * Keeps a focused plot in the visible map: right of the panel (when it is open) and
 * below the header (top 64px); on phones, above the bottom sheet.
 */
function plotFocusPadding(panelOpen: boolean) {
  if (isSmUp()) {
    return { top: 120, bottom: 60, left: 60 + (panelOpen ? PANEL_WIDTH : 0), right: 60 };
  }
  return {
    top: 140,
    bottom: Math.round(window.innerHeight * 0.58) + 24,
    left: 40,
    right: 40,
  };
}

// Zoomed out the map shows region pills; from this zoom, the plots in view.
const VIEWPORT_PLOTS_MIN_ZOOM = 8;
// Wait for the camera to settle before asking for the plots in view.
const VIEWPORT_DEBOUNCE_MS = 300;
// After a My Land link's plots load, its dot stays this long before zooming in,
// and the zoom in to its outline is slower than a click's.
const LINKED_PLOT_ZOOM_DELAY_MS = 800;
const LINKED_PLOT_ZOOM_DURATION_MS = 2200;

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

// Plot names can be long ("[DEMO] Roadside Land Plot in Bang Saray, Pattaya"); a pill that
// wide would hide its neighbours, so the map shows the start of the name.
const MAP_LABEL_MAX_LENGTH = 22;
function mapLabel(text: string) {
  const label = text.trim();
  return label.length > MAP_LABEL_MAX_LENGTH ? `${label.slice(0, MAP_LABEL_MAX_LENGTH - 1).trimEnd()}…` : label;
}

function toMapPlot(plot: ExplorePlot): MapPlot {
  return {
    id: plot.id,
    color: plotColor(plot.status, plot.isOwned),
    center: [plot.coordinates.lng, plot.coordinates.lat],
    polygon: plot.geometry?.coordinates,
    // The plot's name; its number when it has none (as on the plot cards).
    label: mapLabel(plot.plotName?.trim() || plot.name || plot.plotNumber),
    // When labels collide: the user's own plots first, then available, locked, taken.
    priority: plot.isOwned ? 0 : plot.status === "AVAILABLE" ? 1 : plot.status === "LOCKED" ? 2 : 3,
    fill: plot.isOwned ? OWNED_PLOT_FILL : undefined,
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
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
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

/** Location pin with a slash, for the "Current location" failure toast. */
function LocationOffIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path
        d="M12 21s-6-5.4-6-11a6 6 0 0 1 10.2-4.3M18 10c0 5.6-6 11-6 11"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
      <path d="M4 4l16 16" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5">
      <path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

// How long the "Current location" failure toast stays up.
const LOCATION_NOTICE_MS = 6000;

// Toast text for each way "Current location" can fail (translation keys).
const LOCATION_NOTICES = {
  denied: {
    title: "Location access is off",
    body: "Allow location for this site in your browser settings to see where you are on the map.",
  },
  unavailable: {
    title: "Couldn't find your location",
    body: "Make sure location is turned on for your device, then try again.",
  },
} as const;

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
  // From sm up the left panel is always there; this only slides it away (the map gets the room).
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  // Same value, readable inside the map callbacks right after a handler changes it.
  const isPanelCollapsedRef = useRef(false);
  function setPanelCollapsed(collapsed: boolean) {
    isPanelCollapsedRef.current = collapsed;
    setIsPanelCollapsed(collapsed);
  }
  // While the browser looks up the user's location (can take a few seconds).
  const [isLocating, setIsLocating] = useState(false);
  // Why "Current location" failed, shown in a toast beside the map controls.
  const [locationNotice, setLocationNotice] = useState<keyof typeof LOCATION_NOTICES | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  // Applied values; they will drive the plot API once it is wired up.
  const [plotFilters, setPlotFilters] = useState<PlotFilters>(DEFAULT_PLOT_FILTERS);
  // Filter panel options (`/explore/filters?regionId=`), for the open area's region.
  const [filterOptionsResult, setFilterOptionsResult] = useState<
    { regionId: string; options: FilterOptions } | { regionId: string; failed: true } | null
  >(null);
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
  // The text the user last typed. Autocomplete runs only for it, not when the
  // box is filled in for them (opening a region, a recent search, Tab).
  const typedSearchRef = useRef("");
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
  // Plot whose deed (certificate) is being looked up after View Deed.
  const [openingDeedId, setOpeningDeedId] = useState<string | null>(null);
  // Zoomed in with no area open: the plots in view (`GET /explore/plots?bbox=`).
  const [viewportPlots, setViewportPlots] = useState<ExplorePlot[]>([]);
  const [mapView, setMapView] = useState<MapView | null>(null);
  // Regions from `/explore/map`, drawn as pills while zoomed out.
  const [mapRegions, setMapRegions] = useState<
    Array<MapRegion & { location: { lat: number; lng: number } }>
  >([]);
  const showViewportPlots =
    plotScope === null && mapView !== null && mapView.zoom >= VIEWPORT_PLOTS_MIN_ZOOM;
  // An open area shows its own (filtered, sorted) plots; otherwise what's in view.
  // While an area's plots load, the plots already in view stay drawn, so the
  // map doesn't go blank mid-zoom (e.g. opening a plot seen while browsing).
  const areaPlotsPending = plotScope !== null && plotsStatus === "loading" && !plots.length;
  const mapPlots = useMemo(
    () =>
      (plotScope && !areaPlotsPending
        ? plots
        : plotScope || showViewportPlots
          ? viewportPlots
          : []
      ).map(toMapPlot),
    [plotScope, areaPlotsPending, plots, showViewportPlots, viewportPlots],
  );
  const { sortBy, sortOrder } =
    sortOptions.find((option) => option.key === plotSortKey)?.query ?? {};
  // Primitives, so the plots request reruns only when a param really changes.
  const { zoneId, minRai, maxRai, minPrice, maxPrice } = toPlotFilterQuery(plotFilters);
  const hasActiveFilters = [zoneId, minRai, maxRai, minPrice, maxPrice].some(
    (param) => param !== undefined,
  );
  const plotScopeKey = plotScope ? `${plotScope.param}:${plotScope.id}` : null;
  // Filter panel header: the area's plot count without filters. Unfiltered, that's
  // the list; filtered, one count request per area (only once the panel opens).
  const [areaTotalResult, setAreaTotalResult] = useState<{ key: string; total: number } | null>(
    null,
  );
  const areaTotal = !hasActiveFilters
    ? plotsStatus === "ready"
      ? plots.length
      : null
    : areaTotalResult?.key === plotScopeKey
      ? areaTotalResult.total
      : null;
  const needsAreaTotal = isFilterOpen && hasActiveFilters && areaTotal === null;
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
      label: mapLabel(searchParams.get("plotNumber") ?? ""),
      coordinates: [longitude, latitude] as [number, number],
      zoom: Number.isFinite(zoom) ? zoom : 16,
    };
  }, [searchParams]);
  const hasSelectedPlot = Boolean(selectedPlot);
  // A plot linked from My Land ("View Map"): its detail opens once it loads in view.
  const linkedPlotIdRef = useRef(selectedPlot ? searchParams.get("plotId") : null);
  const linkedPlotTimerRef = useRef<number | undefined>(undefined);
  // Until the plots in view load, the linked plot is drawn from the link itself,
  // so its dot and number show as soon as the map does.
  const [showLinkedPreview, setShowLinkedPreview] = useState(hasSelectedPlot);
  const shownMapPlots = useMemo<MapPlot[]>(
    () =>
      showLinkedPreview && selectedPlot
        ? [
            ...mapPlots,
            {
              id: selectedPlot.id,
              color: PLOT_STATUS_COLORS.OWNED,
              fill: OWNED_PLOT_FILL,
              center: selectedPlot.coordinates,
              label: selectedPlot.label,
            },
          ]
        : mapPlots,
    [mapPlots, selectedPlot, showLinkedPreview],
  );

  useEffect(() => {
    if (!isAuthenticated) return;

    const controller = new AbortController();
    getExploreMap(controller.signal)
      .then(({ map, regions }) => {
        initialBoundsRef.current = map.bounds;
        setMapRegions(
          regions.map((region) => ({
            id: region.id,
            name: region.name,
            center: [region.longitude, region.latitude],
            location: { lat: region.latitude, lng: region.longitude },
            imageSrc: regionImageSrc(region.imageUrl),
          })),
        );
        if (!hasSelectedPlot && !hasNavigatedRef.current) {
          mapRef.current?.fitBounds(map.bounds, { padding: thailandViewPadding(!isPanelCollapsedRef.current) });
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
          if (bounds) {
            mapRef.current?.fitBounds(bounds, {
              padding: plotFocusPadding(!isPanelCollapsedRef.current),
              duration: 1200,
            });
          }
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

  // Region whose zones the Filter panel offers: the picked region, or (city / zone)
  // the region its plots belong to.
  const filtersRegionId =
    plotScope?.param === "regionId"
      ? plotScope.id
      : (plots.find((plot) => plot.region)?.region?.id ?? null);

  useEffect(() => {
    if (!isAuthenticated || !filtersRegionId) return;

    const controller = new AbortController();
    getFilterOptions(filtersRegionId, controller.signal)
      .then((options) => setFilterOptionsResult({ regionId: filtersRegionId, options }))
      .catch((error: unknown) => {
        if (isAbortError(error)) return;
        if (isApiError(error) && error.code === "API_SESSION_EXPIRED") return;
        logError(error, "Failed to load filter options");
        setFilterOptionsResult({ regionId: filtersRegionId, failed: true });
      });

    return () => controller.abort();
  }, [isAuthenticated, filtersRegionId, filterOptionsReloadKey]);

  // A city / zone with no matching plots has no region to go by: keep the last options.
  const currentFilterOptions =
    filterOptionsResult && (!filtersRegionId || filterOptionsResult.regionId === filtersRegionId)
      ? filterOptionsResult
      : null;
  const filterOptions =
    currentFilterOptions && "options" in currentFilterOptions ? currentFilterOptions.options : null;
  const filterOptionsStatus = !currentFilterOptions
    ? "loading"
    : "failed" in currentFilterOptions
      ? "error"
      : "ready";

  function retryFilterOptions() {
    setFilterOptionsResult(null);
    setFilterOptionsReloadKey((key) => key + 1);
  }

  useEffect(() => {
    if (!isAuthenticated || !needsAreaTotal || !plotScope || !plotScopeKey) return;
    const controller = new AbortController();
    countPlotsInArea(plotScope, {}, controller.signal)
      .then((total) => setAreaTotalResult({ key: plotScopeKey, total }))
      .catch((error: unknown) => {
        if (isAbortError(error)) return;
        if (isApiError(error) && error.code === "API_SESSION_EXPIRED") return;
        // The header just leaves the number out.
        logError(error, "Failed to count area plots");
      });
    return () => controller.abort();
  }, [isAuthenticated, needsAreaTotal, plotScope, plotScopeKey]);

  // First plots in view after a My Land link: open the linked plot (only that first time).
  const openLinkedPlot = useEffectEvent((items: ExplorePlot[]) => {
    const linkedId = linkedPlotIdRef.current;
    if (!linkedId) return;
    linkedPlotIdRef.current = null;
    setShowLinkedPreview(false);
    const linked = items.find((item) => item.id === linkedId);
    if (!linked) return;
    linkedPlotTimerRef.current = window.setTimeout(
      () => openViewportPlot(linked, LINKED_PLOT_ZOOM_DURATION_MS),
      LINKED_PLOT_ZOOM_DELAY_MS,
    );
  });

  useEffect(() => () => window.clearTimeout(linkedPlotTimerRef.current), []);

  useEffect(() => {
    if (!locationNotice) return;
    const timer = window.setTimeout(() => setLocationNotice(null), LOCATION_NOTICE_MS);
    return () => window.clearTimeout(timer);
  }, [locationNotice]);

  // Browsing (no area open, zoomed in): load the plots in view once the camera settles.
  useEffect(() => {
    if (!isAuthenticated || !showViewportPlots || !mapView) return;
    const { bounds } = mapView;
    if (
      bounds.east - bounds.west > MAX_VIEWPORT_DEGREES ||
      bounds.north - bounds.south > MAX_VIEWPORT_DEGREES
    )
      return;

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      getPlotsInViewport(bounds, controller.signal)
        .then((items) => {
          setViewportPlots(items);
          openLinkedPlot(items);
        })
        .catch((error: unknown) => {
          // Best effort: keep what's drawn; the next move tries again.
          if (isAbortError(error)) return;
          if (isApiError(error) && error.code === "API_SESSION_EXPIRED") return;
          logError(error, "Failed to load plots in view");
        });
    }, VIEWPORT_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [isAuthenticated, showViewportPlots, mapView]);

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

  // Fly to a place and show its plots. A map pin click is not a search, so it
  // isn't saved to recent searches (`remember: false`).
  function openPlace(place: SearchResult, { remember = true } = {}) {
    const scope = plotScopeFor(place);
    if (!scope) {
      flyToPlace(place);
      return;
    }
    // The area's plots (with their labels) mark it, so fly without a pin that would cover them.
    hasNavigatedRef.current = true;
    mapRef.current?.clearMarker();
    // With the panel open, land the place in the middle of the map beside it.
    const panelShift = isSmUp() && !isPanelCollapsedRef.current ? PANEL_WIDTH / 2 : 0;
    void mapRef.current?.flyToView({
      center: [place.location.lng, place.location.lat],
      zoom: PLACE_ZOOM[place.type.toUpperCase()] ?? 11,
      duration: 1500,
      ...(panelShift && { offset: [panelShift, 0] as [number, number] }),
    });
    showAreaPlots(scope, place.name);
    if (remember) rememberPlace(place);
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
      // Zone ids belong to the old area's region.
      setPlotFilters((filters) => (filters.zones.length ? { ...filters, zones: [] } : filters));
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
  function focusPlot(
    plot: Pick<ExplorePlot, "coordinates" | "geometry">,
    duration = 1200,
  ) {
    hasNavigatedRef.current = true;
    const bounds = polygonBounds(plot);
    if (bounds) {
      mapRef.current?.fitBounds(bounds, {
        padding: plotFocusPadding(!isPanelCollapsedRef.current),
        maxZoom: PLOT_FOCUS_MAX_ZOOM,
        duration,
      });
      return;
    }
    void mapRef.current?.flyToView({
      center: [plot.coordinates.lng, plot.coordinates.lat],
      zoom: 15,
      duration,
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
  // the list and the open detail, and show it in the navbar badge and cart progress
  // at once (the shared cart snapshot then reloads the real numbers).
  async function addToCart(plotId: string) {
    if (addingPlotIds.includes(plotId)) return;
    setAddingPlotIds((ids) => [...ids, plotId]);
    setSearchMessage("");
    try {
      await addPlotToCart(plotId);
      const added =
        plots.find((plot) => plot.id === plotId) ??
        viewportPlots.find((plot) => plot.id === plotId) ??
        (plotDetail?.status === "ready" && plotDetail.id === plotId ? plotDetail.plot : undefined);
      setPlots((current) =>
        current.map((plot) => (plot.id === plotId ? { ...plot, isInCart: true } : plot)),
      );
      setPlotDetail((current) =>
        current?.status === "ready" && current.id === plotId
          ? { ...current, plot: { ...current.plot, isInCart: true } }
          : current,
      );
      applyCartChange(1, { rai: added?.sizeRai ?? 0, total: added?.totalPrice ?? 0 });
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

  // View Deed: the deed is the certificate of the order that bought the plot, so find that
  // order (`GET /lands/plots`) and open its certificate page.
  async function viewDeed(plotId: string) {
    if (openingDeedId) return;
    setOpeningDeedId(plotId);
    setSearchMessage("");
    try {
      const orderId = await getPlotDeedOrderId(plotId);
      if (orderId) {
        router.push(`${routes.certificates}/${encodeURIComponent(orderId)}`);
        return;
      }
      showSearchMessage("Your deed isn't ready yet.");
    } catch (error) {
      if (isApiError(error) && error.code === "API_SESSION_EXPIRED") return;
      logError(error, "Failed to open deed");
      showSearchMessage("Couldn't open the deed. Please try again.");
    }
    setOpeningDeedId(null);
  }

  // Back to the area's list: zoom out so all its plots show again (the detail zoomed to one).
  function closePlotDetail() {
    setDetailPlotId(null);
    const bounds = plotsBounds(plots);
    if (!bounds) return;
    hasNavigatedRef.current = true;
    mapRef.current?.fitBounds(bounds, { padding: plotFocusPadding(!isPanelCollapsedRef.current), duration: 1200 });
  }

  function retryPlotDetail() {
    if (!detailPlotId) return;
    setPlotDetail({ id: detailPlotId, status: "loading" });
    setPlotDetailReloadKey((key) => key + 1);
  }

  // Opens the left panel if it was slid away, then runs `action` (which frames the
  // map for the open panel).
  function withPanelOpen(action: () => void) {
    if (isPanelCollapsed) setPanelCollapsed(false);
    action();
  }

  function handleMapPlotClick(plotId: string) {
    const plot = plots.find((item) => item.id === plotId);
    if (plot) {
      withPanelOpen(() => openPlotDetail(plot));
      return;
    }
    const inView = viewportPlots.find((item) => item.id === plotId);
    if (inView) withPanelOpen(() => openViewportPlot(inView));
  }

  // A plot seen while browsing: open its region's list, then its detail.
  function openViewportPlot(inView: ExplorePlot, zoomDuration?: number) {
    if (inView.region) {
      hasNavigatedRef.current = true;
      showAreaPlots({ param: "regionId", id: inView.region.id }, inView.region.name);
      setSearch(inView.region.name);
    }
    setSelectedPlotId(inView.id);
    setPlotDetail({ id: inView.id, status: "loading" });
    setDetailPlotId(inView.id);
    setIsSearchExpanded(true);
    focusPlot(inView, zoomDuration);
  }

  // Region pill: the same as picking the region in search.
  function handleMapRegionClick(regionId: string) {
    const region = mapRegions.find((item) => item.id === regionId);
    if (!region) return;
    setIsSearchExpanded(true);
    withPanelOpen(() =>
      openPlace(
        {
          type: "region",
          id: region.id,
          name: region.name,
          imageUrl: null,
          location: region.location,
        },
        { remember: false },
      ),
    );
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
    if (search !== typedSearchRef.current || query.length < MIN_SUGGESTION_QUERY_LENGTH) return;

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
      // Same as clicking the place's chip on the map: one fly to its centre. (Fitting
      // to its plots zoomed out whenever one plot sat far away.) Entries often come
      // without `location`; a region's centre is on its map chip.
      const location =
        item.location ??
        (type === "REGION"
          ? mapRegions.find((region) => region.id === item.referenceId)?.location
          : undefined);
      if (location) {
        openPlace(
          { type: item.type, id: item.referenceId, name: item.query, imageUrl: null, location },
          { remember: false },
        );
        return;
      }
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
      <PageLoader label={t("Loading...")} />
    );
  if (!isAuthenticated) {
    router.replace(routes.login);
    return null;
  }

  return (
    <main
      className={`relative min-h-[100svh] overflow-hidden text-navy [&_.mapboxgl-ctrl-top-right]:mt-[66px] [&_.mapboxgl-ctrl-bottom-left]:transition-[margin] [&_.mapboxgl-ctrl-bottom-left]:duration-300 ${isPanelCollapsed ? "" : "sm:[&_.mapboxgl-ctrl-bottom-left]:ml-[340px]"} ${mapStatus === "error" ? "bg-[#eef3f6]" : "bg-[#74d0e1]"}`}
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
          `${isSearchExpanded && showPlotList ? "max-sm:pb-[58svh] max-sm:pt-32" : ""} ${isPanelCollapsed ? "" : "sm:pl-[340px]"}`
        }
        loadingLabels={{
          title: t("Loading Map"),
          subtitle: t("Preparing Thailand for exploration..."),
        }}
        plots={shownMapPlots}
        onPlotClick={handleMapPlotClick}
        regions={mapRegions}
        regionsMaxZoom={VIEWPORT_PLOTS_MIN_ZOOM}
        onRegionClick={handleMapRegionClick}
        onViewChange={setMapView}
      />

      {hasMapError && !isErrorDismissed ? (
        // Centred on screen; from sm up it slides right of the search panel while
        // that is open, matching the search box's 300ms width transition.
        <div
          className={`pointer-events-none absolute inset-0 z-30 flex items-center justify-center px-4 transition-[padding] duration-300 ease-out motion-reduce:transition-none ${isPanelCollapsed ? "" : "sm:pl-[340px]"}`}
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

      {/* From sm up: a full-height white panel on the left (the search bar with its Filter/Sort icons, then the list). On phones the wrapper disappears
          (display: contents) and the pieces keep their own positions. */}
      <div
        className={`contents sm:absolute sm:bottom-0 sm:left-0 sm:top-[65px] lg:top-0 sm:z-20 sm:flex sm:w-[340px] sm:flex-col sm:border-r sm:border-[#e6eaf3] sm:bg-white sm:shadow-[4px_0_24px_-12px_rgba(11,31,77,0.2)] sm:transition-transform sm:duration-300 motion-reduce:sm:transition-none ${isPanelCollapsed ? "sm:-translate-x-full" : ""}`}
      >
      <div
        ref={searchAreaRef}
        // An open Filter/Sort panel is inside this box, so the box itself must sit
        // above the plot list (phones: a z-30 bottom sheet) or it covers "Apply".
        className={`absolute inset-x-4 top-20 flex items-start gap-2 sm:relative sm:inset-x-auto sm:top-auto sm:grid sm:shrink-0 sm:gap-0 sm:p-4 ${isFilterOpen || isSortOpen ? "z-40" : "z-20"}`}
        onMouseEnter={() => setIsSearchExpanded(true)}
      >
        <label
          className={`flex h-11 min-w-0 flex-1 items-center gap-2 rounded-[10px] bg-white/95 px-4 text-[12px] text-[#aab2bd] shadow-[0_3px_12px_rgba(11,31,77,0.12)] sm:h-12 sm:flex-none sm:gap-3 sm:rounded-[12px] sm:border sm:border-[#dde3ec] sm:bg-white sm:px-4 sm:text-[14px] sm:shadow-none sm:transition-colors sm:focus-within:border-navy sm:[grid-area:1/1] ${plotScope && !detailPlotId ? "sm:pr-[84px]" : ""}`}
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
                typedSearchRef.current = event.target.value;
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
                mapRef.current?.fitBounds(initialBoundsRef.current, {
                  duration: 1200,
                  padding: thailandViewPadding(!isPanelCollapsedRef.current),
                });
                hasNavigatedRef.current = false;
              }}
              className="flex cursor-pointer items-center justify-center text-[#8c96a3]"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
                <path
                  d="m6 6 12 12M18 6 6 18"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="1.7"
                />
              </svg>
            </button>
          ) : null}
        </label>
        {/* Filter and Sort act on an area's plots, so they show once one is open. */}
        {plotScope && !detailPlotId ? (
          <div className={`contents sm:z-10 sm:mr-2 sm:flex sm:gap-0.5 sm:self-center sm:justify-self-end sm:[grid-area:1/1] ${isSearchExpanded ? "" : "max-sm:hidden"}`}>
            <div className="relative sm:static">
              <button
                type="button"
                aria-expanded={isFilterOpen}
                onClick={() => {
                  setIsFilterOpen((open) => !open);
                  setIsSortOpen(false);
                }}
                aria-label={t("Filter")}
                className={`flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-[10px] bg-white/95 text-[12px] text-[#6d7784] shadow-[0_3px_12px_rgba(11,31,77,0.12)] transition-colors sm:h-9 sm:w-9 sm:rounded-lg sm:border sm:px-0 sm:shadow-none ${isFilterOpen ? "sm:border-navy sm:bg-navy sm:text-white sm:hover:bg-navy" : hasActiveFilters ? "sm:border-navy sm:bg-[#eef3fb] sm:text-navy sm:hover:bg-[#e3ebf7]" : "sm:border-transparent sm:bg-transparent sm:text-[#5b6472] sm:hover:bg-[#f1f4f9]"}`}
              >
                <svg viewBox="0 0 20 20" aria-hidden="true" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                  <path d="M3 6h8M15 6h2M3 14h2M9 14h8" />
                  <circle cx="13" cy="6" r="2" />
                  <circle cx="7" cy="14" r="2" />
                </svg>
                <span className="hidden">{t("Filter")}</span>
              </button>
              {isFilterOpen ? (
                <FilterPlotsPanel
                  value={plotFilters}
                  options={filterOptions}
                  status={filterOptionsStatus}
                  onRetry={retryFilterOptions}
                  areaName={plotAreaName}
                  areaTotal={areaTotal}
                  appliedCount={plotsStatus === "ready" ? plots.length : null}
                  onApply={applyFilters}
                  onClose={() => setIsFilterOpen(false)}
                  t={t}
                />
              ) : null}
            </div>
            <div className="relative sm:static">
              <button
                type="button"
                aria-expanded={isSortOpen}
                onClick={() => {
                  setIsSortOpen((open) => !open);
                  setIsFilterOpen(false);
                }}
                aria-label={t("Sort")}
                className={`flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-[10px] bg-white/95 text-[12px] text-[#6d7784] shadow-[0_3px_12px_rgba(11,31,77,0.12)] transition-colors sm:h-9 sm:w-9 sm:rounded-lg sm:border sm:px-0 sm:shadow-none ${isSortOpen ? "sm:border-navy sm:bg-navy sm:text-white sm:hover:bg-navy" : "sm:border-transparent sm:bg-transparent sm:text-[#5b6472] sm:hover:bg-[#f1f4f9]"}`}
              >
                <svg viewBox="0 0 20 20" aria-hidden="true" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 16V4M7 4 4 7M7 4l3 3M13 4v12m0 0-3-3m3 3 3-3" />
                </svg>
                <span className="hidden">{t("Sort")}</span>
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
          </div>
        ) : null}
      </div>

      {(
        <section
          ref={searchPanelRef}
          className={
            (isSearchExpanded ? "" : "max-sm:hidden ") +
            (showPlotList
              ? // Phones: bottom sheet so the map stays visible. From sm: Figma
                // "list of plots" panel (420 wide, radius 24), 16px below the search box and
                // 16px above the screen bottom; scrolls inside.
                "fixed inset-x-0 bottom-0 z-30 flex h-[58svh] flex-col overflow-hidden rounded-t-[24px] bg-white shadow-[0_-8px_24px_rgba(0,0,0,0.12)] sm:pointer-events-auto sm:relative sm:inset-x-auto sm:bottom-auto sm:z-10 sm:h-auto sm:min-h-0 sm:flex-1 sm:rounded-none sm:border-t sm:border-[#eef1f4] sm:shadow-none"
              : `absolute inset-x-4 top-32 z-10 flex max-h-[calc(100svh-12rem)] flex-col overflow-hidden rounded-[18px] bg-white/95 p-4 shadow-[0_5px_20px_rgba(11,31,77,0.14)] sm:pointer-events-auto sm:relative sm:inset-x-auto sm:top-auto sm:max-h-[calc(100svh-11rem)] sm:min-h-0 sm:rounded-none sm:border-t sm:border-[#eef1f4] sm:bg-white sm:px-3 sm:pb-3 sm:pt-2 sm:shadow-none ${hasMapError ? "h-[calc(100svh-15rem)]" : ""} ${
                  // Phones: the error dialog would sit on top of this panel, so
                  // hide it until "Continue" (it then shows "Map unavailable").
                  hasMapError && !isErrorDismissed ? "max-sm:hidden" : ""
                }`)
          }
        >
          {showPlotList ? (
            <>
              {/* Grab handle look for the phone bottom sheet, with a close button. */}
              <div className="relative flex h-9 shrink-0 items-center justify-center sm:hidden">
                <span aria-hidden="true" className="h-1 w-10 rounded-full bg-[#d9e1ea]" />
                <button
                  type="button"
                  aria-label={t("Close")}
                  onClick={() => {
                    setIsSearchExpanded(false);
                    setIsFilterOpen(false);
                    setIsSortOpen(false);
                  }}
                  className="absolute right-3 top-1.5 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[#f4f7fa] text-[#6d7784] hover:text-navy"
                >
                  <CloseIcon />
                </button>
              </div>
              <div
                // New key per view, so opening a detail (or going back) starts at the top.
                key={detailPlotId ?? "plot-list"}
                // The detail lays out its own padding so its image can sit edge to edge.
                className={`flex min-h-0 flex-1 flex-col overflow-y-auto ${detailPlotId ? "" : "gap-[14px] px-4 pb-6 pt-1 sm:py-6"} ${SLIM_SCROLLBAR}`}
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
                      isOpeningDeed={openingDeedId === openDetail.plot.id}
                      onViewDeed={() => void viewDeed(openDetail.plot.id)}
                      onBack={closePlotDetail}
                      t={t}
                    />
                  ) : openDetail?.status === "error" ? (
                    <PlotDetailError
                      notFound={openDetail.notFound}
                      onRetry={retryPlotDetail}
                      onBack={closePlotDetail}
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
                      isOpeningDeed={openingDeedId === plot.id}
                      onViewDeed={(item) => void viewDeed(item.id)}
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
      )}
      </div>

      {/* Slides the left panel away and back (sm and up). */}
      <button
        type="button"
        aria-label={t(isPanelCollapsed ? "Open panel" : "Close panel")}
        aria-expanded={!isPanelCollapsed}
        onClick={() => setPanelCollapsed(!isPanelCollapsed)}
        className={`absolute top-1/2 z-30 hidden h-14 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-r-[10px] border border-l-0 border-[#e6eaf3] bg-white text-navy shadow-[2px_0_12px_-4px_rgba(11,31,77,0.25)] transition-[left] duration-300 hover:bg-[#f5f7fb] motion-reduce:transition-none sm:flex ${isPanelCollapsed ? "left-0" : "left-[340px]"}`}
      >
        <svg viewBox="0 0 16 16" aria-hidden="true" className={`h-4 w-4 ${isPanelCollapsed ? "rotate-180" : ""}`}>
          <path d="m10 3-5 5 5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Bottom right corner. On phones it hides under the open plot sheet. */}
      <div
        className={`absolute bottom-3 right-3 flex max-w-[calc(100%-8rem)] flex-wrap items-center justify-end gap-3 rounded-md bg-white/95 px-3 py-2 text-[9px] text-[#273044] shadow-[0_3px_12px_rgba(11,31,77,0.12)] sm:bottom-3 sm:right-4 sm:max-w-none sm:rounded-full sm:px-4 ${showPlotList && isSearchExpanded ? "max-sm:hidden" : ""}`}
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

      {locationNotice ? (
        // Beside the map controls, level with the "Current location" button.
        <div
          role="status"
          className="absolute bottom-[8.8rem] right-[4.25rem] z-20 flex w-[min(320px,calc(100vw-6rem))] items-start gap-2.5 rounded-[12px] border border-[#fde2b8] bg-white p-3 shadow-[0_8px_24px_rgba(11,31,77,0.14)] sm:bottom-[9.3rem] sm:right-[5rem]"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#fff4e5] text-[#b45309]">
            <LocationOffIcon />
          </span>
          <div className="min-w-0 flex-1 font-manrope">
            <p className="text-[13px] font-semibold leading-5 text-navy">
              {t(LOCATION_NOTICES[locationNotice].title)}
            </p>
            <p className="mt-0.5 text-[12px] leading-[1.45] text-[#6b7785]">
              {t(LOCATION_NOTICES[locationNotice].body)}
            </p>
          </div>
          <button
            type="button"
            aria-label={t("Close")}
            onClick={() => setLocationNotice(null)}
            className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-[#8b939e] hover:bg-[#f4f7fa] hover:text-navy"
          >
            <CloseIcon />
          </button>
        </div>
      ) : null}

      <div className="absolute bottom-12 right-5 flex flex-col items-center gap-3 sm:bottom-14 sm:right-6">
        <button
          type="button"
          aria-label={t("Current location")}
          aria-busy={isLocating}
          disabled={isLocating}
          onClick={() => {
            if (!mapRef.current) return;
            hasNavigatedRef.current = true;
            setLocationNotice(null);
            setIsLocating(true);
            void mapRef.current
              .locate()
              .then((result) => {
                if (result !== "success") setLocationNotice(result);
              })
              .finally(() => setIsLocating(false));
          }}
          className="cursor-pointer flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#5f6368] shadow-[0_1px_4px_rgba(60,64,67,0.3)] transition-colors hover:bg-[#f1f3f4] disabled:cursor-wait"
        >
          <span className={isLocating ? "animate-pulse motion-reduce:animate-none" : undefined}>
            <LocateIcon />
          </span>
        </button>
        <div className="flex flex-col overflow-hidden rounded-[20px] bg-white text-[20px] leading-none text-[#5f6368] shadow-[0_1px_4px_rgba(60,64,67,0.3)]">
          <button
            type="button"
            aria-label={t("Zoom in")}
            onClick={() => mapRef.current?.zoomIn()}
            className="cursor-pointer flex h-10 w-10 items-center justify-center transition-colors hover:bg-[#f1f3f4]"
          >
            +
          </button>
          <span className="mx-auto h-px w-6 bg-[#e3e6ea]" />
          <button
            type="button"
            aria-label={t("Zoom out")}
            onClick={() => mapRef.current?.zoomOut()}
            className="cursor-pointer flex h-10 w-10 items-center justify-center transition-colors hover:bg-[#f1f3f4]"
          >
            −
          </button>
        </div>
      </div>
    </main>
  );
}
