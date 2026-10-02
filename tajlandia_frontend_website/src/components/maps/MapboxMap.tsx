"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { cn } from "@/lib/utils/cn";

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
  /** Camera-only flight (no marker). Waits for the map to load; resolves when the flight ends. */
  flyToView: (view: {
    center: [number, number];
    zoom: number;
    duration?: number;
    curve?: number;
    bearing?: number;
    pitch?: number;
  }) => Promise<void>;
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
  /** "globe" shows the Earth as a sphere when zoomed out (blends to flat when zoomed in). */
  projection?: "mercator" | "globe";
  selectedLocation?: {
    id: string;
    coordinates: [number, number];
    zoom?: number;
  };
};

export const MapboxMap = forwardRef<MapboxMapHandle, MapboxMapProps>(function MapboxMap(
  { className, initialCenter, initialZoom, projection = "mercator", selectedLocation },
  ref,
) {
  const projectionRef = useRef(projection);
  const loadedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const selectedMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const initialViewRef = useRef({
    center:
      initialCenter ?? selectedLocation?.coordinates ?? ([100.5, 15] as [number, number]),
    zoom: initialZoom ?? selectedLocation?.zoom ?? 4.5,
  });
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

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
      projection: { name: projectionRef.current },
      attributionControl: false,
    });

    mapRef.current = map;
    // Keep the required Mapbox attribution compact and inside the map frame.
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");
    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(containerRef.current);
    map.once("load", () => {
      loadedRef.current = true;
      map.resize();
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
    map.on("error", (event) => {
      console.error("Mapbox failed to load", event.error);
      if (!map.isStyleLoaded() && !disposed) setStatus("error");
    });

    return () => {
      disposed = true;
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
      loadedRef.current = false;
    };
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      zoomIn: () => mapRef.current?.zoomIn(),
      zoomOut: () => mapRef.current?.zoomOut(),
      flyToCoordinates: (coordinates, zoom = 13, label = "Selected location") => {
        focusLocation(coordinates, zoom, label);
      },
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
          if (!response.ok) return "error";

          const data = (await response.json()) as {
            features?: GeocodeFeature[];
          };
          const feature = data.features?.find(
            (item) => item.center && isThailandFeature(item),
          );
          const center = feature?.center;

          if (!feature || !center) return "not-found";
          focusLocation(
            center,
            zoomForPlace(feature.place_type?.[0]),
            feature.text || normalizedQuery,
          );
          return "success";
        } catch {
          return "error";
        }
      },
      flyToView: async ({
        center,
        zoom,
        duration = 3000,
        curve = 1.6,
        bearing = 0,
        pitch = 0,
      }) => {
        const map = mapRef.current;
        if (!map) return;
        if (!loadedRef.current) {
          await new Promise<void>((resolve) => map.once("load", () => resolve()));
        }
        await new Promise<void>((resolve) => {
          map.once("moveend", () => resolve());
          map.flyTo({ center, zoom, duration, curve, bearing, pitch, essential: true });
        });
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
