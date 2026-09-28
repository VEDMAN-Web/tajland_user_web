"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { cn } from "@/lib/utils/cn";

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
};

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
  onPlotClick?: (plotId: string) => void;
};

export const MapboxMap = forwardRef<MapboxMapHandle, MapboxMapProps>(function MapboxMap(
  { className, initialCenter, initialZoom, selectedLocation, plotMarkers, onPlotClick },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const selectedMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const plotMarkersRef = useRef<mapboxgl.Marker[]>([]);
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
    map.on("error", (event) => {
      console.error("Mapbox failed to load", event.error);
      if (!map.isStyleLoaded() && !disposed) setStatus("error");
    });

    return () => {
      disposed = true;
      resizeObserver.disconnect();
      clearPlotMarkers();
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
            limit: "1",
            language: "en",
            types: "country,region,place,locality,poi,address",
          });
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(normalizedQuery)}.json?${params}`,
          );
          if (!response.ok) return "error";

          const data = (await response.json()) as {
            features?: Array<{
              center?: [number, number];
              properties?: { short_code?: string };
              context?: Array<{ short_code?: string }>;
            }>;
          };
          const feature = data.features?.[0];
          const countryCode =
            feature?.properties?.short_code ??
            feature?.context?.find((item) => item.short_code?.startsWith("th"))
              ?.short_code;
          const center = feature?.center;

          if (!center || countryCode?.toLowerCase() !== "th") return "not-found";
          focusLocation(center, 13, normalizedQuery);
          return "success";
        } catch {
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
