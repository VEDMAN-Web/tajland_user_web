/**
 * useViewportLoader hook
 * 
 * Handles viewport-based plot loading with debouncing.
 * Loads plots when the map viewport changes (pan/zoom).
 * Uses SINGLE batched API call for entire viewport (Google Maps style).
 */

"use client";

import { useCallback, useRef } from "react";
import type { MapboxMapHandle } from "@/components/maps/MapboxMap";
import { bboxToString, type BBox } from "@/lib/viewport-caching/tile-grid";
import { fetchPlots } from "../services/explore.service";
import type { PlotListItem, PlotFilterParams } from "@/lib/api/explore.schemas";

export interface UseViewportLoaderOptions {
  mapRef: React.RefObject<MapboxMapHandle | null>;
  filters?: PlotFilterParams;
  onPlotsLoaded?: (plots: PlotListItem[]) => void;
}

export function useViewportLoader({ mapRef, filters, onPlotsLoaded }: UseViewportLoaderOptions) {
  const isLoadingRef = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastBboxRef = useRef<string>("");

  /**
   * Load plots for the current viewport (DEBOUNCED)
   */
  const loadViewport = useCallback(() => {
    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce: wait 500ms after map stops moving
    debounceTimerRef.current = setTimeout(async () => {
      const map = mapRef.current?.getMap();
      if (!map || isLoadingRef.current) {
        return;
      }

      // Check zoom level - only load plots when zoomed in enough
      const zoom = map.getZoom();
      const MIN_ZOOM_FOR_PLOTS = 8; // Require zoom level 8+ to load plots
      
      if (zoom < MIN_ZOOM_FOR_PLOTS) {
        console.log(`[ViewportLoader] ⏸️ Skipped: zoom ${zoom.toFixed(1)} < ${MIN_ZOOM_FOR_PLOTS} (zoom in to see plots)`);
        return;
      }

      const bounds = map.getBounds();
      if (!bounds) {
        return;
      }

      const bbox: BBox = {
        west: bounds.getWest(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        north: bounds.getNorth(),
      };

      // Calculate viewport area (rough approximation)
      const width = bbox.east - bbox.west;
      const height = bbox.north - bbox.south;
      const area = width * height;
      
      // Backend may reject if viewport is too large
      // Thailand bounds: ~9° lng × ~16° lat = ~144 deg²
      // At zoom 8, viewport is typically ~3° × 2° = ~6 deg²
      const MAX_VIEWPORT_AREA = 50; // degrees² (roughly zoom 7+)
      
      if (area > MAX_VIEWPORT_AREA) {
        console.log(`[ViewportLoader] ⏸️ Skipped: viewport too large (${area.toFixed(1)}° > ${MAX_VIEWPORT_AREA}°). Zoom in to load plots.`);
        return;
      }

      const bboxString = bboxToString(bbox);

      // Skip if same bbox as last request
      if (bboxString === lastBboxRef.current) {
        console.log("[ViewportLoader] Skipped: same viewport as last request");
        return;
      }

      console.log(`[ViewportLoader] Loading viewport (zoom: ${zoom.toFixed(1)}, area: ${area.toFixed(1)}°):`, bbox);

      // Cancel previous request if still running
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        console.log("[ViewportLoader] ⚠️ Cancelled previous request");
      }

      // Create new abort controller
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      isLoadingRef.current = true;
      lastBboxRef.current = bboxString;

      try {
        // SINGLE API CALL for entire viewport
        const response = await fetchPlots({
          ...filters,
          bbox: bboxString,
          limit: 1000, // Get all plots in viewport
        });

        // Check if request was aborted
        if (abortController.signal.aborted) {
          console.log("[ViewportLoader] ⚠️ Request aborted");
          return;
        }

        console.log(`[ViewportLoader] ✅ Loaded ${response.items.length} plots`);

        // Notify parent
        if (onPlotsLoaded) {
          onPlotsLoaded(response.items);
        }
      } catch (error: unknown) {
        // Ignore abort errors
        if ((error as Error)?.name === "AbortError") {
          console.log("[ViewportLoader] Request cancelled");
          return;
        }
        
        // Handle viewport too large error
        const errorMessage = (error as Error)?.message || "";
        if (errorMessage.includes("VIEWPORT_TOO_LARGE") || errorMessage.includes("400")) {
          console.warn("[ViewportLoader] ⚠️ Viewport too large - zoom in to load plots");
          return;
        }
        
        console.error("[ViewportLoader] ❌ Failed to load viewport:", error);
      } finally {
        isLoadingRef.current = false;
        if (abortControllerRef.current === abortController) {
          abortControllerRef.current = null;
        }
      }
    }, 500); // 500ms debounce
  }, [mapRef, filters, onPlotsLoaded]);

  /**
   * Clear cache and reset state
   */
  const clearCache = useCallback(() => {
    lastBboxRef.current = "";
    console.log("[ViewportLoader] State cleared");
  }, []);

  return {
    loadViewport,
    clearCache,
  };
}
