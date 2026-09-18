"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { cn } from "@/lib/utils/cn";

export type MapboxMapHandle = {
  zoomIn: () => void;
  zoomOut: () => void;
  locate: () => void;
  flyToCoordinates: (coordinates: [number, number]) => void;
  searchAndFlyTo: (query: string) => Promise<"success" | "not-found" | "error">;
};

type MapboxMapProps = {
  className?: string;
  initialCenter?: [number, number];
  initialZoom?: number;
};

export const MapboxMap = forwardRef<MapboxMapHandle, MapboxMapProps>(function MapboxMap(
  { className, initialCenter = [100.5, 15], initialZoom = 4.5 },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

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
      center: initialCenter,
      zoom: initialZoom,
      minZoom: 2,
      projection: { name: "mercator" },
      attributionControl: true,
    });

    mapRef.current = map;
    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(containerRef.current);
    map.once("load", () => map.resize());
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
    };
  }, []);

  useImperativeHandle(ref, () => ({
    zoomIn: () => mapRef.current?.zoomIn(),
    zoomOut: () => mapRef.current?.zoomOut(),
    flyToCoordinates: (coordinates) => {
      mapRef.current?.flyTo({ center: coordinates, zoom: 9, essential: true });
    },
    searchAndFlyTo: async (query) => {
      const map = mapRef.current;
      const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
      const normalizedQuery = query.trim();

      if (!map || !accessToken || !normalizedQuery) return "not-found";

      try {
        const params = new URLSearchParams({
          access_token: accessToken,
          country: "th",
          bbox: "97.3,5.6,105.7,20.5",
          limit: "1",
          language: "en",
        });
        const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(normalizedQuery)}.json?${params}`);
        if (!response.ok) return "error";

        const data = await response.json() as { features?: Array<{ center?: [number, number]; properties?: { short_code?: string }; context?: Array<{ short_code?: string }> }> };
        const feature = data.features?.[0];
        const countryCode = feature?.properties?.short_code ?? feature?.context?.find((item) => item.short_code?.startsWith("th"))?.short_code;
        const center = feature?.center;

        if (!center || countryCode?.toLowerCase() !== "th") return "not-found";
        map.flyTo({ center, zoom: 9, essential: true });
        return "success";
      } catch {
        return "error";
      }
    },
    locate: () => {
      if (!mapRef.current || !navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(({ coords }) => {
        mapRef.current?.flyTo({ center: [coords.longitude, coords.latitude], zoom: 10 });
      });
    },
  }), []);

  return (
    <div className={cn("relative h-full min-h-[100svh] w-full", className)} aria-label="Interactive Thailand map">
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />
      <div className={cn("pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-[#effbfd]/75 transition-opacity duration-300", status === "loading" ? "opacity-100" : "opacity-0")} aria-hidden={status !== "loading"}>
        <div className="flex h-[116px] w-[220px] flex-col items-center justify-center rounded-[14px] bg-white shadow-[0_8px_24px_rgba(11,31,77,0.08)]">
          <span className="h-7 w-7 animate-spin rounded-full border-[4px] border-[#151515]/20 border-t-[#151515]" />
          <strong className="mt-2 text-[14px] font-bold text-[#151515]">Loading Map</strong>
          <span className="mt-1 text-[11px] text-[#737373]">Preparing Thailand for exploration...</span>
        </div>
      </div>
      {status === "error" ? <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#74d0e1] px-6 text-center text-sm text-navy">The map could not be loaded. Please check your connection and try again.</div> : null}
    </div>
  );
});
