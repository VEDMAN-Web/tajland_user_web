/**
 * MapboxMap Component
 * 
 * Renders an interactive Mapbox GL map with Thailand focus.
 * 
 * Current features:
 * - DOM-based plot markers (colored dots by status)
 * - Search/geocoding for Thai locations
 * - Click handlers for plot selection
 * 
 * Migration in progress:
 * - Adding GeoJSON polygon layers for plot boundaries
 * - Markers will serve as fallback for plots without geometry
 * - Polygons render below markers (z-index via layer order)
 */

"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { cn } from "@/lib/utils/cn";
import type { PlotFeatureCollection } from "@/lib/api/explore.schemas";

export type PlotMarker = {
  id: string;
  coordinates: [number, number];
  status: "AVAILABLE" | "LOCKED" | "CLAIMED" | "SOLD";
  isOwned?: boolean;
};

export type MapboxMapHandle = {
  zoomIn: () => void;
  zoomOut: () => void;
  locate: () => void;
  flyToCoordinates: (
    coordinates: [number, number],
    zoom?: number,
    label?: string,
  ) => void;
  searchAndFlyTo: (query: string) => Promise<"success" | "not-found" | "error">;
  setPlotMarkers: (plots: PlotMarker[]) => void;
  clearPlotMarkers: () => void;
  setPlotPolygons: (data: PlotFeatureCollection) => void;
  setStatusFilter: (status: "AVAILABLE" | "LOCKED" | "CLAIMED" | "SOLD" | "OWNED" | "all" | null) => void;
  getMap: () => mapboxgl.Map | null;
};

type GeocodeFeature = {
  center?: [number, number];
  text?: string;
  place_name?: string;
  place_type?: string[];
  properties?: { short_code?: string };
  context?: Array<{ id?: string; short_code?: string }>;
};

const thailandBounds = { west: 97.3, south: 5.6, east: 105.7, north: 20.5 };

function isInsideThailand(center: [number, number]) {
  const [lng, lat] = center;
  return (
    lng >= thailandBounds.west &&
    lng <= thailandBounds.east &&
    lat >= thailandBounds.south &&
    lat <= thailandBounds.north
  );
}

function isThailandFeature(feature: GeocodeFeature) {
  const country = feature.context?.find((item) => item.id?.startsWith("country."));
  if (country?.short_code?.toLowerCase() === "th") return true;
  if (
    feature.place_type?.includes("country") &&
    feature.properties?.short_code?.toLowerCase() === "th"
  ) {
    return true;
  }
  if (feature.place_name?.toLowerCase().includes("thailand")) return true;
  return feature.center ? isInsideThailand(feature.center) : false;
}

function zoomForPlace(placeType?: string) {
  if (placeType === "region") return 8;
  if (placeType === "district") return 9.5;
  if (placeType === "place") return 11;
  if (placeType === "locality") return 12.5;
  return 14;
}

type MapboxMapProps = {
  className?: string;
  initialCenter?: [number, number];
  initialZoom?: number;
  selectedLocation?: {
    id: string;
    coordinates: [number, number];
    zoom?: number;
  };
  plotMarkers?: PlotMarker[];
  plotPolygons?: PlotFeatureCollection;
  onPlotClick?: (plotId: string) => void;
  onViewportChange?: () => void;
};

export const MapboxMap = forwardRef<MapboxMapHandle, MapboxMapProps>(function MapboxMap(
  { className, initialCenter, initialZoom, selectedLocation, plotMarkers, plotPolygons, onPlotClick, onViewportChange },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const selectedMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const plotMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const hoveredPlotIdRef = useRef<string | null>(null);
  const selectedPlotIdRef = useRef<string | null>(null);
  const initialViewRef = useRef({
    center:
      initialCenter ?? selectedLocation?.coordinates ?? ([100.5, 15] as [number, number]),
    zoom: initialZoom ?? selectedLocation?.zoom ?? 4.5,
  });
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  function createPlotMarkerElement(plot: PlotMarker): HTMLElement {
    const el = document.createElement("div");
    el.className = "plot-marker";
    el.style.cursor = "pointer";
    el.style.width = "20px";
    el.style.height = "20px";
    el.style.borderRadius = "50%";
    el.style.border = "2px solid white";
    el.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)";
    el.style.transition = "transform 0.2s";

    // Status colors matching Figma
    const colors = {
      AVAILABLE: "#2cbf65", // green
      LOCKED: "#e7b52c",    // yellow
      CLAIMED: "#d64242",   // red/taken
      SOLD: "#d64242",      // red/taken
    };

    // User's own plots get navy blue
    el.style.background = plot.isOwned ? "#0b1f4d" : colors[plot.status];

    el.addEventListener("mouseenter", () => {
      el.style.transform = "scale(1.2)";
    });
    el.addEventListener("mouseleave", () => {
      el.style.transform = "scale(1)";
    });

    if (onPlotClick) {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onPlotClick(plot.id);
      });
    }

    return el;
  }

  function setPlotMarkers(plots: PlotMarker[]) {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers
    plotMarkersRef.current.forEach((m) => m.remove());
    plotMarkersRef.current = [];

    // Add new markers
    // Note: In the future, this should only render markers for plots that have
    // coordinates but NO valid geometry (fallback for plots without polygons).
    // For now, we render all provided markers to maintain backward compatibility.
    plots.forEach((plot) => {
      if (!plot.coordinates) return;
      const marker = new mapboxgl.Marker({
        element: createPlotMarkerElement(plot),
        anchor: "center",
      })
        .setLngLat(plot.coordinates)
        .addTo(map);

      plotMarkersRef.current.push(marker);
    });
  }

  function clearPlotMarkers() {
    plotMarkersRef.current.forEach((m) => m.remove());
    plotMarkersRef.current = [];
  }

  function setupPolygonLayers(map: mapboxgl.Map) {
    // Only set up if style is loaded and source doesn't already exist
    if (!map.isStyleLoaded() || map.getSource("plots")) return;

    // Add empty GeoJSON source with promoteId for feature state
    map.addSource("plots", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [],
      },
      promoteId: "id",
    });

    // Layer 1: Fill (polygon interior)
    map.addLayer({
      id: "plots-fill",
      type: "fill",
      source: "plots",
      minzoom: 11, // Changed from 13 to 11 for earlier visibility
      paint: {
        "fill-color": [
          "match",
          ["get", "displayStatus"],
          "AVAILABLE", "#2CBF65",  // green
          "LOCKED", "#E7B52C",      // yellow
          "CLAIMED", "#D64242",     // red
          "SOLD", "#D64242",        // red
          "OWNED", "#0B1F4D",       // navy blue
          "#999999",                // fallback gray
        ],
        "fill-opacity": [
          "case",
          ["boolean", ["feature-state", "hover"], false], 0.55,
          ["==", ["get", "displayStatus"], "OWNED"], 0.5,
          0.3,
        ],
      },
    });

    // Layer 2: Line (polygon border)
    map.addLayer({
      id: "plots-line",
      type: "line",
      source: "plots",
      minzoom: 11, // Changed from 13 to 11 for earlier visibility
      paint: {
        "line-color": [
          "match",
          ["get", "displayStatus"],
          "AVAILABLE", "#2CBF65",
          "LOCKED", "#E7B52C",
          "CLAIMED", "#D64242",
          "SOLD", "#D64242",
          "OWNED", "#0B1F4D",
          "#999999",
        ],
        "line-width": [
          "case",
          ["boolean", ["feature-state", "selected"], false], 3,
          2,
        ],
        "line-opacity": 1,
      },
    });

    // Layer 3: Label (plot names)
    map.addLayer({
      id: "plots-label",
      type: "symbol",
      source: "plots",
      minzoom: 14,
      layout: {
        "text-field": ["get", "name"],
        "text-size": 12,
        "text-anchor": "center",
        "text-allow-overlap": false,
        "text-ignore-placement": false,
      },
      paint: {
        "text-color": "#151515",
        "text-halo-color": "#ffffff",
        "text-halo-width": 1.2,
      },
    });
  }

  function cleanupPolygonLayers(map: mapboxgl.Map) {
    // Remove layers in reverse order (top to bottom)
    const layers = ["plots-label", "plots-line", "plots-fill"];
    layers.forEach((layerId) => {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
    });

    // Remove source
    if (map.getSource("plots")) {
      map.removeSource("plots");
    }
  }

  function setPlotPolygons(data: PlotFeatureCollection) {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) {
      console.log("[MapboxMap] ⚠️ Cannot set polygons - map not ready");
      return;
    }

    const source = map.getSource("plots") as mapboxgl.GeoJSONSource | undefined;
    if (source) {
      console.log("[MapboxMap] 📍 Setting plot polygons:", {
        featureCount: data.features.length,
        zoom: map.getZoom().toFixed(1),
        minZoomForVisibility: 13,
        willBeVisible: map.getZoom() >= 13
      });
      source.setData(data);
    } else {
      console.log("[MapboxMap] ⚠️ Plots source not found");
    }
  }

  function setupPolygonInteractions(map: mapboxgl.Map) {
    // Only set up if layer exists
    if (!map.getLayer("plots-fill")) return;

    // Hover interaction
    const onMouseMove = (e: mapboxgl.MapMouseEvent) => {
      if (!map.isStyleLoaded()) return;
      
      const features = map.queryRenderedFeatures(e.point, {
        layers: ["plots-fill"],
      }) as Array<{ id?: string | number; properties?: Record<string, unknown> }>;

      // Clear previous hover state
      if (hoveredPlotIdRef.current !== null) {
        map.setFeatureState(
          { source: "plots", id: hoveredPlotIdRef.current },
          { hover: false }
        );
      }

      if (features.length > 0) {
        const feature = features[0];
        if (!feature) return;
        
        const plotId = (feature.id ?? feature.properties?.id) as string;
        
        if (!plotId) return;
        
        // Set new hover state
        hoveredPlotIdRef.current = plotId;
        map.setFeatureState(
          { source: "plots", id: plotId },
          { hover: true }
        );
        
        // Change cursor
        map.getCanvas().style.cursor = "pointer";
      } else {
        hoveredPlotIdRef.current = null;
        map.getCanvas().style.cursor = "";
      }
    };

    const onMouseLeave = () => {
      if (!map.isStyleLoaded()) return;
      
      // Clear hover state when leaving the layer
      if (hoveredPlotIdRef.current !== null) {
        map.setFeatureState(
          { source: "plots", id: hoveredPlotIdRef.current },
          { hover: false }
        );
        hoveredPlotIdRef.current = null;
      }
      map.getCanvas().style.cursor = "";
    };

    // Click interaction with 5px tolerance
    const onClick = (e: mapboxgl.MapMouseEvent) => {
      if (!map.isStyleLoaded()) return;

      // Build 5px bbox around click point for better tap targeting
      const bbox: [mapboxgl.PointLike, mapboxgl.PointLike] = [
        [e.point.x - 5, e.point.y - 5],
        [e.point.x + 5, e.point.y + 5],
      ];

      const features = map.queryRenderedFeatures(bbox, {
        layers: ["plots-fill"],
      }) as Array<{ id?: string | number; properties?: Record<string, unknown> }>;

      // Clear previous selection
      if (selectedPlotIdRef.current !== null) {
        map.setFeatureState(
          { source: "plots", id: selectedPlotIdRef.current },
          { selected: false }
        );
      }

      if (features.length > 0) {
        const feature = features[0];
        if (!feature) {
          selectedPlotIdRef.current = null;
          return;
        }
        
        const plotId = (feature.id ?? feature.properties?.id) as string;

        if (!plotId) {
          selectedPlotIdRef.current = null;
          return;
        }

        // Set new selection
        selectedPlotIdRef.current = plotId;
        map.setFeatureState(
          { source: "plots", id: plotId },
          { selected: true }
        );

        // Call external click handler
        if (onPlotClick) {
          onPlotClick(plotId);
        }
      } else {
        // Empty click - clear selection
        selectedPlotIdRef.current = null;
      }
    };

    // Attach listeners
    map.on("mousemove", "plots-fill", onMouseMove);
    map.on("mouseleave", "plots-fill", onMouseLeave);
    map.on("click", onClick);

    // Store handlers for cleanup (attach to map object)
    type MapWithHandlers = mapboxgl.Map & {
      _plotInteractionHandlers?: {
        onMouseMove: typeof onMouseMove;
        onMouseLeave: typeof onMouseLeave;
        onClick: typeof onClick;
      };
    };
    (map as MapWithHandlers)._plotInteractionHandlers = {
      onMouseMove,
      onMouseLeave,
      onClick,
    };
  }

  function cleanupPolygonInteractions(map: mapboxgl.Map) {
    type MapWithHandlers = mapboxgl.Map & {
      _plotInteractionHandlers?: {
        onMouseMove: (e: mapboxgl.MapMouseEvent) => void;
        onMouseLeave: () => void;
        onClick: (e: mapboxgl.MapMouseEvent) => void;
      };
    };
    const handlers = (map as MapWithHandlers)._plotInteractionHandlers;
    if (!handlers) return;

    // Remove all event listeners
    map.off("mousemove", "plots-fill", handlers.onMouseMove);
    map.off("mouseleave", "plots-fill", handlers.onMouseLeave);
    map.off("click", handlers.onClick);

    // Clear refs
    hoveredPlotIdRef.current = null;
    selectedPlotIdRef.current = null;

    // Clean up stored handlers
    delete (map as MapWithHandlers)._plotInteractionHandlers;
  }

  function setStatusFilter(status: "AVAILABLE" | "LOCKED" | "CLAIMED" | "SOLD" | "OWNED" | "all" | null) {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const layers = ["plots-fill", "plots-line", "plots-label"];
    const filter = 
      status === "all" || status === null
        ? null
        : ["==", ["get", "displayStatus"], status];

    layers.forEach((layerId) => {
      if (map.getLayer(layerId)) {
        map.setFilter(layerId, filter);
      }
    });
  }

  function focusLocation(coordinates: [number, number], zoom: number, label: string) {
    const map = mapRef.current;
    if (!map) return;

    map.flyTo({ center: coordinates, zoom, essential: true });
    selectedMarkerRef.current?.remove();

    const markerElement = document.createElement("div");
    markerElement.style.alignItems = "center";
    markerElement.style.display = "flex";
    markerElement.style.flexDirection = "column";
    markerElement.style.gap = "5px";
    markerElement.style.pointerEvents = "none";

    const labelElement = document.createElement("span");
    labelElement.textContent = label;
    labelElement.style.background = "#082a68";
    labelElement.style.borderRadius = "999px";
    labelElement.style.boxShadow = "0 2px 8px rgba(8,42,104,.25)";
    labelElement.style.color = "white";
    labelElement.style.fontSize = "11px";
    labelElement.style.fontWeight = "600";
    labelElement.style.padding = "4px 9px";

    const pin = document.createElement("span");
    pin.style.background = "#082a68";
    pin.style.border = "3px solid white";
    pin.style.borderRadius = "50%";
    pin.style.boxShadow = "0 0 0 6px rgba(8,42,104,.18)";
    pin.style.height = "14px";
    pin.style.width = "14px";
    markerElement.append(labelElement, pin);

    selectedMarkerRef.current = new mapboxgl.Marker({
      element: markerElement,
      anchor: "bottom",
    })
      .setLngLat(coordinates)
      .addTo(map);
  }

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!accessToken) {
      setStatus("error");
      return;
    }

    mapboxgl.accessToken = accessToken;
    let disposed = false;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: initialViewRef.current.center,
      zoom: initialViewRef.current.zoom,
      minZoom: 2,
      projection: { name: "mercator" },
      attributionControl: false,
    });

    mapRef.current = map;
    // Keep the required Mapbox attribution compact and inside the map frame.
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");
    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(containerRef.current);
    map.once("load", () => map.resize());
    map.once("load", () => {
      setupPolygonLayers(map);
      setupPolygonInteractions(map);
    });
    map.once("load", () => {
      if (!selectedLocation) return;
      focusLocation(
        selectedLocation.coordinates,
        selectedLocation.zoom ?? 16,
        selectedLocation.id,
      );
    });
    map.once("idle", () => {
      if (!disposed) setStatus("ready");
    });
    
    // Viewport change listener for lazy loading
    if (onViewportChange) {
      map.on("moveend", onViewportChange);
    }
    
    map.on("error", (event) => {
      console.error("Mapbox failed to load", event.error);
      if (!map.isStyleLoaded() && !disposed) setStatus("error");
    });

    return () => {
      disposed = true;
      resizeObserver.disconnect();
      clearPlotMarkers();
      if (onViewportChange) {
        map.off("moveend", onViewportChange);
      }
      if (map.isStyleLoaded()) {
        cleanupPolygonInteractions(map);
        cleanupPolygonLayers(map);
      }
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update plot markers when prop changes
  useEffect(() => {
    if (status === "ready" && plotMarkers) {
      setPlotMarkers(plotMarkers);
    }
  }, [plotMarkers, status]);

  // Update plot polygons when prop changes
  useEffect(() => {
    if (status === "ready" && plotPolygons) {
      setPlotPolygons(plotPolygons);
    }
  }, [plotPolygons, status]);

  useImperativeHandle(
    ref,
    () => ({
      zoomIn: () => mapRef.current?.zoomIn(),
      zoomOut: () => mapRef.current?.zoomOut(),
      flyToCoordinates: (coordinates, zoom = 13, label = "Selected location") => {
        focusLocation(coordinates, zoom, label);
      },
      setPlotMarkers,
      clearPlotMarkers,
      setPlotPolygons,
      setStatusFilter,
      getMap: () => mapRef.current,
      searchAndFlyTo: async (query) => {
        const map = mapRef.current;
        const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
        const normalizedQuery = query.trim();

        if (!map || !accessToken || !normalizedQuery) return "not-found";

        try {
          if (!map.isStyleLoaded()) {
            await new Promise<void>((resolve) => {
              map.once("load", () => resolve());
            });
          }

          const params = new URLSearchParams({
            access_token: accessToken,
            country: "th",
            bbox: "97.3,5.6,105.7,20.5",
            limit: "5",
            language: "en",
            types: "region,district,place,locality,poi",
          });
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(normalizedQuery)}.json?${params}`,
          );
          if (!response.ok) {
            console.error("[Mapbox] API error:", response.status);
            return "error";
          }

          const data = (await response.json()) as {
            features?: GeocodeFeature[];
          };
          const feature = data.features?.find(
            (item) => item.center && isThailandFeature(item),
          );
          const center = feature?.center;

          if (!feature || !center) return "not-found";
          focusLocation(center, zoomForPlace(feature.place_type?.[0]), feature.text || normalizedQuery);
          return "success";
        } catch (error) {
          console.error("[Mapbox] Geocoding error:", error);
          return "error";
        }
      },
      locate: () => {
        if (!mapRef.current || !navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(({ coords }) => {
          mapRef.current?.flyTo({
            center: [coords.longitude, coords.latitude],
            zoom: 10,
          });
        });
      },
    }),
    [],
  );

  return (
    <div
      className={cn("relative h-full min-h-[100svh] w-full", className)}
      aria-label="Interactive Thailand map"
    >
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />
      <div
        className={cn(
          "pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-[#effbfd]/75 transition-opacity duration-300",
          status === "loading" ? "opacity-100" : "opacity-0",
        )}
        aria-hidden={status !== "loading"}
      >
        <div className="flex h-[116px] w-[220px] flex-col items-center justify-center rounded-[14px] bg-white shadow-[0_8px_24px_rgba(11,31,77,0.08)]">
          <span className="h-7 w-7 animate-spin rounded-full border-[4px] border-[#151515]/20 border-t-[#151515]" />
          <strong className="mt-2 text-[14px] font-bold text-[#151515]">
            Loading Map
          </strong>
          <span className="mt-1 text-[11px] text-[#737373]">
            Preparing Thailand for exploration...
          </span>
        </div>
      </div>
      {status === "error" ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#74d0e1] px-6 text-center text-sm text-navy">
          The map could not be loaded. Please check your connection and try again.
        </div>
      ) : null}
    </div>
  );
});
