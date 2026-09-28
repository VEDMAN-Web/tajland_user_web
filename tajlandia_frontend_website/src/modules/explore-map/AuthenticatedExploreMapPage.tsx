"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { routes } from "@/lib/constants/routes";
import { useAuth } from "@/lib/hooks/useAuth";
import { addToCart } from "@/lib/utils/cart.utils";
import { DashboardNavbar } from "@/modules/dashboard/DashboardNavbar";
import { MapboxMap, type MapboxMapHandle, type PlotMarker } from "@/components/maps/MapboxMap";
import { useDashboardLanguage } from "@/modules/dashboard/DashboardLanguageContext";
import { useExploreMap } from "./hooks/useExploreMap";
import { useExploreSearch } from "./hooks/useExploreSearch";
import { PlotBottomSheet } from "./components/PlotBottomSheet";
import type { PlotStatus } from "@/lib/api/explore.schemas";

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
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useDashboardLanguage();

  // Hooks
  const exploreMap = useExploreMap();
  const exploreSearch = useExploreSearch();

  // UI state
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<PlotStatus | "all">("all");
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null);
  // Convert plots to markers for MapboxMap
  const plotMarkers = useMemo<PlotMarker[]>(() => {
    return exploreMap.plots
      .filter((plot) => plot.coordinates)
      .map((plot) => ({
        id: plot.id,
        coordinates: [plot.coordinates!.lng, plot.coordinates!.lat] as [number, number],
        status: plot.status,
        isOwned: exploreMap.myPlots.some((mp) => mp.id === plot.id),
      }));
  }, [exploreMap.plots, exploreMap.myPlots]);

  // URL-driven plot selection (deep link support)
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

  useEffect(() => {
    if (!isSearchExpanded) return;

    function handleOutsidePointer(event: PointerEvent) {
      if (!searchAreaRef.current?.contains(event.target as Node)) {
        setIsSearchExpanded(false);
        setIsFilterOpen(false);
        setIsSortOpen(false);
        setShowAllHistory(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsSearchExpanded(false);
        setIsFilterOpen(false);
        setIsSortOpen(false);
        setShowAllHistory(false);
      }
    }

    document.addEventListener("pointerdown", handleOutsidePointer);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handleOutsidePointer);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isSearchExpanded]);

  // Search results visibility
  const visibleHistory = showAllHistory
    ? exploreSearch.recentSearches
    : exploreSearch.recentSearches.slice(0, 6);

  async function handleSearchSubmit() {
    if (!exploreSearch.query.trim()) {
      console.log("[Search] Empty query, skipping");
      return;
    }
    
    console.log("[Search] Starting search for:", exploreSearch.query);
    
    // Perform search to get results
    await exploreSearch.performSearch();
    
    console.log("[Search] Results received:", exploreSearch.results);
    
    // If we have search results, handle based on type
    if (exploreSearch.results.length > 0) {
      const firstResult = exploreSearch.results[0];
      
      if (!firstResult) {
        console.log("[Search] No first result found");
      } else {
        console.log("[Search] First result:", firstResult);
        
        // Filter map based on search result type
        if (firstResult.type === "REGION" && firstResult.id) {
          console.log("[Search] Filtering by region:", firstResult.id);
          exploreMap.setFilters({ regionId: firstResult.id });
        } else if (firstResult.type === "CITY" && firstResult.id) {
          console.log("[Search] Filtering by city:", firstResult.id);
          exploreMap.setFilters({ cityId: firstResult.id });
        } else if (firstResult.type === "ZONE" && firstResult.id) {
          console.log("[Search] Filtering by zone:", firstResult.id);
          exploreMap.setFilters({ zoneId: firstResult.id });
        }
        
        // Use Mapbox geocoding to fly to the location name
        console.log("[Search] Flying to location:", firstResult.name);
        const result = await mapRef.current?.searchAndFlyTo(firstResult.name);
        console.log("[Search] Mapbox result:", result);
        
        if (result === "success") {
          setIsSearchExpanded(false);
          return;
        }
      }
    }
    
    // Fall back to Mapbox geocoding with the raw query
    console.log("[Search] Falling back to raw query geocoding");
    const result = await mapRef.current?.searchAndFlyTo(exploreSearch.query);
    console.log("[Search] Fallback result:", result);
    
    if (result === "success") {
      setIsSearchExpanded(false);
    } else if (result === "not-found") {
      console.log("[Search] Location not found");
      exploreSearch.setQuery(exploreSearch.query); // Keep the query
    }
  }

  function handlePlotClick(plotId: string) {
    setSelectedPlotId(plotId);
  }

  function handleAddToCart(plotId: string) {
    const plot = exploreMap.plots.find((p) => p.id === plotId);
    if (!plot) {
      console.error("[Cart] Plot not found:", plotId);
      return;
    }

    const success = addToCart({
      id: `cart-${Date.now()}`,
      plotId: plot.id,
      name: plot.name || `Plot ${plot.plotNumber || plotId}`,
      region: plot.region?.name,
      city: plot.city?.name,
      rai: plot.sizeRai || 0,
      pricePerRai: plot.pricePerRai || 0,
      amount: plot.totalPrice || (plot.sizeRai || 0) * (plot.pricePerRai || 0),
      image: plot.imageUrl,
      coordinates: plot.coordinates,
    });

    if (success) {
      console.log("[Cart] Added plot to cart:", plotId);
      // Optionally show success notification
      setSelectedPlotId(null);
      
      // Refresh plot list to update cart status
      exploreMap.refetchPlots();
    } else {
      console.warn("[Cart] Failed to add plot to cart");
    }
  }

  function applyStatusFilter(status: PlotStatus | "all") {
    setStatusFilter(status);
    if (status === "all") {
      exploreMap.setFilters({ status: undefined });
    } else {
      // LOCKED status causes backend 500 error - map to AVAILABLE temporarily
      const mappedStatus = status === "LOCKED" ? "AVAILABLE" : status;
      exploreMap.setFilters({ status: mappedStatus });
      
      if (status === "LOCKED") {
        console.warn("[Filter] LOCKED status has backend issue, showing AVAILABLE instead");
      }
    }
    setIsFilterOpen(false);
  }

  // Auth guard
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(routes.login);
    }
  }, [isAuthenticated, isLoading, router]);

  // Show error notification if map fails to load
  useEffect(() => {
    if (exploreMap.error) {
      console.error("[ExploreMap] Error:", exploreMap.error);
    }
  }, [exploreMap.error]);

  if (isLoading || exploreMap.isLoadingMap) {
    return (
      <main className="flex min-h-[100svh] items-center justify-center bg-white text-sm text-muted">
        {t("Loading map...")}
      </main>
    );
  }

  if (!isAuthenticated) return null;

  // Show error state if critical error occurred
  if (exploreMap.error && !exploreMap.mapConfig) {
    return (
      <main className="flex min-h-[100svh] flex-col items-center justify-center gap-4 bg-white px-4 text-center">
        <p className="text-sm text-red-600">{exploreMap.error}</p>
        <button
          onClick={() => exploreMap.refetchAll()}
          className="rounded-lg bg-navy px-4 py-2 text-sm text-white hover:bg-navy/90"
        >
          Retry
        </button>
      </main>
    );
  }

  return (
    <main className="relative min-h-[100svh] overflow-hidden bg-[#74d0e1] text-navy">
      <MapboxMap
        ref={mapRef}
        className="absolute inset-0"
        initialCenter={
          exploreMap.mapConfig
            ? [exploreMap.mapConfig.center.lng, exploreMap.mapConfig.center.lat]
            : undefined
        }
        selectedLocation={selectedPlot}
        plotMarkers={plotMarkers}
        onPlotClick={handlePlotClick}
      />

      <DashboardNavbar active="explore" overlay />

      <div className="absolute left-5 top-20 z-20 sm:left-8 sm:top-24">
        <div
          ref={searchAreaRef}
          className="flex flex-col items-start gap-2"
          onMouseEnter={() => setIsSearchExpanded(true)}
        >
          <div className="flex items-start gap-2">
            <label
              className={`flex h-11 items-center gap-2 rounded-[10px] bg-white/95 px-4 text-[12px] text-[#aab2bd] shadow-[0_3px_12px_rgba(11,31,77,0.12)] transition-[width] duration-300 ${isSearchExpanded ? "w-[300px]" : "w-[150px]"}`}
            >
              <span className="sr-only">Search Maps</span>
              <input
                type="search"
                value={exploreSearch.query}
                onFocus={() => setIsSearchExpanded(true)}
                onChange={(event) => exploreSearch.setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void handleSearchSubmit();
                  }
                }}
                placeholder="Search Maps"
                className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[#aab2bd]"
              />
              <SearchIcon />
              {exploreSearch.query ? (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => exploreSearch.clearSearch()}
                  className="text-lg leading-none text-[#8c96a3]"
                >
                  ×
                </button>
              ) : null}
            </label>
            {isSearchExpanded ? (
              <>
                <div className="relative">
                  <button
                    type="button"
                    aria-expanded={isFilterOpen}
                    onClick={() => {
                      setIsFilterOpen((open) => !open);
                      setIsSortOpen(false);
                    }}
                    className="flex h-11 items-center gap-1 rounded-[10px] bg-white/95 px-3 text-[12px] text-[#6d7784] shadow-[0_3px_12px_rgba(11,31,77,0.12)]"
                  >
                    ☷ Filter
                  </button>
                  {isFilterOpen ? (
                    <div className="absolute left-0 top-12 w-36 rounded-[10px] bg-white p-2 text-[11px] shadow-[0_5px_18px_rgba(11,31,77,0.16)]">
                      <button
                        type="button"
                        onClick={() => applyStatusFilter("all")}
                        className={`block w-full rounded-md px-2 py-1.5 text-left ${statusFilter === "all" ? "bg-[#edf3ff] text-navy" : "text-[#6d7784] hover:bg-[#f5f7fa]"}`}
                      >
                        All plots
                      </button>
                      {exploreMap.filterOptions?.statuses.map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => applyStatusFilter(status as PlotStatus)}
                          className={`block w-full rounded-md px-2 py-1.5 text-left ${statusFilter === status ? "bg-[#edf3ff] text-navy" : "text-[#6d7784] hover:bg-[#f5f7fa]"}`}
                        >
                          {status[0] + status.slice(1).toLowerCase()}
                        </button>
                      ))}
                    </div>
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
                    className="flex h-11 items-center gap-1 rounded-[10px] bg-white/95 px-3 text-[12px] text-[#6d7784] shadow-[0_3px_12px_rgba(11,31,77,0.12)]"
                  >
                    ↕ Sort
                  </button>
                  {isSortOpen ? (
                    <div className="absolute left-0 top-12 w-48 rounded-[10px] bg-white p-2 text-[11px] shadow-[0_5px_18px_rgba(11,31,77,0.16)]">
                      {exploreMap.sortOptions.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => {
                            exploreMap.setFilters({ sortBy: option.id });
                            setIsSortOpen(false);
                          }}
                          className={`block w-full rounded-md px-2 py-1.5 text-left ${exploreMap.activeFilters.sortBy === option.id ? "bg-[#edf3ff] text-navy" : "text-[#6d7784] hover:bg-[#f5f7fa]"}`}
                        >
                          {option.name}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </>
            ) : null}
          </div>

          {isSearchExpanded ? (
            <section className="flex max-h-[calc(100svh-12rem)] w-[304px] flex-col overflow-hidden rounded-[18px] bg-white/95 p-4 shadow-[0_5px_20px_rgba(11,31,77,0.14)]">
              <div className="min-h-0 overflow-y-auto pr-1">
                {exploreSearch.error ? (
                  <p className="px-2 py-3 text-center text-[11px] text-[#b42318]">
                    {exploreSearch.error}
                  </p>
                ) : null}
                {exploreSearch.isFetchingSuggestions ? (
                  <p className="px-2 py-3 text-center text-[11px] text-[#8d97a3]">
                    Loading suggestions...
                  </p>
                ) : exploreSearch.suggestions.length > 0 ? (
                  exploreSearch.suggestions.map((suggestion, idx) => {
                    const name = typeof suggestion === "string" ? suggestion : suggestion.name;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={async () => {
                          console.log("[Click] Suggestion clicked:", name);
                          exploreSearch.setQuery(name);
                          // Small delay to ensure state updates
                          await new Promise(resolve => setTimeout(resolve, 50));
                          console.log("[Click] Query set, calling handleSearchSubmit");
                          await handleSearchSubmit();
                          console.log("[Click] handleSearchSubmit completed");
                        }}
                        className="flex w-full items-center gap-3 rounded-[10px] p-2 text-left hover:bg-[#f5f7fa]"
                      >
                        <span className="min-w-0 flex-1">
                          <strong className="block truncate text-[12px] font-medium text-navy">
                            {name}
                          </strong>
                        </span>
                        <span className="text-[#aab2bd]">›</span>
                      </button>
                    );
                  })
                ) : visibleHistory.length ? (
                  visibleHistory.map((search) => (
                    <button
                      key={search.id}
                      type="button"
                      onClick={async () => {
                        console.log("[Click] Recent search clicked:", search.query);
                        exploreSearch.setQuery(search.query);
                        // Small delay to ensure state updates
                        await new Promise(resolve => setTimeout(resolve, 50));
                        console.log("[Click] Query set, calling handleSearchSubmit");
                        await handleSearchSubmit();
                        console.log("[Click] handleSearchSubmit completed");
                      }}
                      className="flex w-full items-center gap-3 rounded-[10px] p-2 text-left hover:bg-[#f5f7fa]"
                    >
                      <span className="min-w-0 flex-1">
                        <strong className="block truncate text-[12px] font-medium text-navy">
                          {search.query}
                        </strong>
                        <span className="block text-[10px] text-[#8d97a3]">
                          {new Date(search.createdAt).toLocaleDateString()}
                        </span>
                      </span>
                      <span className="text-[#aab2bd]">›</span>
                    </button>
                  ))
                ) : (
                  <p className="px-2 py-8 text-center text-[11px] text-[#8d97a3]">
                    {exploreSearch.isLoadingHistory
                      ? "Loading history..."
                      : "No recent searches"}
                  </p>
                )}
              </div>
              {visibleHistory.length < exploreSearch.recentSearches.length ? (
                <button
                  type="button"
                  onClick={() => setShowAllHistory((show) => !show)}
                  className="mt-3 shrink-0 border-t border-[#edf0f3] pt-3 text-center text-[11px] text-navy"
                >
                  {showAllHistory ? "Show less" : "More from recent history"}
                </button>
              ) : null}
            </section>
          ) : null}
        </div>
      </div>

      <PlotBottomSheet
        plotId={selectedPlotId}
        onClose={() => setSelectedPlotId(null)}
        onAddToCart={handleAddToCart}
      />

      <div className="absolute bottom-9 left-5 flex max-w-[calc(100%-6rem)] flex-wrap items-center gap-3 rounded-md bg-white/95 px-3 py-2 text-[9px] text-[#273044] shadow-[0_3px_12px_rgba(11,31,77,0.12)] sm:bottom-10 sm:left-8 sm:max-w-none">
        <span className="font-medium uppercase tracking-wide">Plot Status</span>
        <span className="flex items-center gap-1">
          <i className="h-1.5 w-1.5 rounded-full bg-[#2cbf65]" />
          Available
        </span>
        <span className="flex items-center gap-1">
          <i className="h-1.5 w-1.5 rounded-full bg-[#e7b52c]" />
          Locked
        </span>
        <span className="flex items-center gap-1">
          <i className="h-1.5 w-1.5 rounded-full bg-[#d64242]" />
          Taken
        </span>
        <span className="hidden items-center gap-1 sm:flex">
          <i className="h-1.5 w-1.5 rounded-full bg-navy" />
          Your plots
        </span>
      </div>

      <div className="absolute bottom-9 right-5 flex flex-col items-center gap-3 sm:bottom-10 sm:right-8">
        <button
          type="button"
          aria-label="Current location"
          onClick={() => mapRef.current?.locate()}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-[0_3px_12px_rgba(11,31,77,0.12)]"
        >
          <LocateIcon />
        </button>
        <div className="flex flex-col overflow-hidden rounded-full bg-white/95 shadow-[0_3px_12px_rgba(11,31,77,0.12)]">
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() => mapRef.current?.zoomIn()}
            className="flex h-9 w-9 items-center justify-center hover:bg-[#f4f7fa]"
          >
            +
          </button>
          <span className="mx-auto h-px w-4 bg-line" />
          <button
            type="button"
            aria-label="Zoom out"
            onClick={() => mapRef.current?.zoomOut()}
            className="flex h-9 w-9 items-center justify-center hover:bg-[#f4f7fa]"
          >
            −
          </button>
        </div>
      </div>
    </main>
  );
}
