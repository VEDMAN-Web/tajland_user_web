/**
 * useExploreMap hook
 *
 * Manages map data, plot list, filters, and pagination state.
 * Fetches initial map config + plots on mount, re-fetches when filters change.
 */

"use client";

import { useEffect, useState } from "react";
import { isBrowserApiError } from "@/lib/api/client.browser";
import type {
  FilterOptions,
  MapConfig,
  PlotFilterParams,
  PlotListItem,
  PlotSummary,
} from "@/lib/api/explore.schemas";
import {
  fetchExploreMap,
  fetchFilterOptions,
  fetchMyPlots,
  fetchPlots,
  fetchSortOptions,
  type ExploreMapData,
  type PlotsPage,
} from "../services/explore.service";

export type UseExploreMapState = {
  // Map
  mapConfig: MapConfig | null;
  regions: ExploreMapData["regions"];

  // mapPlots: from GET /explore/map — carries geometry for polygon rendering
  mapPlots: PlotSummary[];
  // plots: from GET /explore/plots — paginated list for sidebar/search cards (no geometry)
  plots: PlotListItem[];
  myPlots: PlotListItem[];
  pagination: PlotsPage["pagination"] | null;
  
  // Filters
  filterOptions: FilterOptions | null;
  sortOptions: Array<{ id: string; name: string }>;
  activeFilters: PlotFilterParams;
  
  // Loading & errors
  isLoadingMap: boolean;
  isLoadingPlots: boolean;
  error: string | null;
  
  // Actions
  setFilters: (filters: PlotFilterParams) => void;
  updatePlots: (plots: PlotListItem[]) => void;
  updateMapPlots: (plots: PlotSummary[]) => void;
  refetchPlots: () => void;
  refetchAll: () => void;
};

export function useExploreMap(): UseExploreMapState {
  const [mapConfig, setMapConfig] = useState<MapConfig | null>(null);
  const [regions, setRegions] = useState<ExploreMapData["regions"]>([]);
  const [mapPlots, setMapPlots] = useState<PlotSummary[]>([]); // from /explore/map — has geometry
  const [plots, setPlots] = useState<PlotListItem[]>([]); // from /explore/plots — no geometry
  const [myPlots, setMyPlots] = useState<PlotListItem[]>([]);
  const [pagination, setPagination] = useState<PlotsPage["pagination"] | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [sortOptions, setSortOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [activeFilters, setActiveFilters] = useState<PlotFilterParams>({
    page: 1,
    limit: 100,
  });
  const [isLoadingMap, setIsLoadingMap] = useState(true);
  const [isLoadingPlots, setIsLoadingPlots] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initial load: map + filter options + sort options + my plots
  useEffect(() => {
    let mounted = true;

    Promise.all([
      fetchExploreMap(),
      fetchFilterOptions(), // Now handles 401 gracefully with defaults
      fetchSortOptions(), // Now handles 401 gracefully with defaults
      fetchMyPlots().catch(() => []), // Non-critical, requires auth
    ])
      .then(([mapData, filters, sorts, owned]) => {
        if (!mounted) return;
        setMapConfig(mapData.map);
        setRegions(mapData.regions);
        setMapPlots(mapData.plots); // ← keep geometry-bearing plots from /explore/map
        setFilterOptions(filters);
        setSortOptions(sorts);
        setMyPlots(owned as PlotListItem[]);
        setError(null);
      })
      .catch((err) => {
        if (!mounted) return;
        const errorMessage = isBrowserApiError(err) 
          ? err.message 
          : "Failed to load map data";
        
        // Don't show error if it's just auth-related for optional features
        if (isBrowserApiError(err) && err.status === 401) {
          console.warn("[useExploreMap] Some features require authentication");
          // Still set error to null since we handled it gracefully
          setError(null);
        } else {
          setError(errorMessage);
        }
      })
      .finally(() => {
        if (mounted) setIsLoadingMap(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // NOTE: Plot fetching is now handled by viewport loader (useViewportLoader hook)
  // This prevents unnecessary pagination-based API calls
  // Plots are loaded dynamically based on the visible map area

  const setFilters = (filters: PlotFilterParams) => {
    setActiveFilters((prev) => ({ ...prev, ...filters, page: 1 }));
  };

  const updatePlots = (newPlots: PlotListItem[]) => {
    setPlots(newPlots);
  };

  const updateMapPlots = (newPlots: PlotSummary[]) => {
    setMapPlots(newPlots);
  };

  const refetchPlots = () => {
    setActiveFilters((prev) => ({ ...prev }));
  };

  const refetchAll = () => {
    setIsLoadingMap(true);
    Promise.all([
      fetchExploreMap(),
      fetchFilterOptions(), // Handles 401 gracefully
      fetchMyPlots().catch(() => []), // Non-critical, requires auth
    ])
      .then(([mapData, filters, owned]) => {
        setMapConfig(mapData.map);
        setRegions(mapData.regions);
        setMapPlots(mapData.plots); // ← keep geometry-bearing plots
        setFilterOptions(filters);
        setMyPlots(owned as PlotListItem[]);
        setError(null);
      })
      .catch((err) => {
        const errorMessage = isBrowserApiError(err)
          ? err.message
          : "Failed to refresh data";
        
        // Don't show error if it's just auth-related for optional features
        if (isBrowserApiError(err) && err.status === 401) {
          console.warn("[useExploreMap] Some features require authentication");
          setError(null);
        } else {
          setError(errorMessage);
        }
      })
      .finally(() => {
        setIsLoadingMap(false);
        refetchPlots();
      });
  };

  return {
    mapConfig,
    regions,
    mapPlots,
    plots,
    myPlots,
    pagination,
    filterOptions,
    sortOptions,
    activeFilters,
    isLoadingMap,
    isLoadingPlots,
    error,
    setFilters,
    updatePlots,
    updateMapPlots,
    refetchPlots,
    refetchAll,
  };
}
