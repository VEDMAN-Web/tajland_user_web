"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import dynamic from "next/dynamic";
import type { MapboxMapHandle, MapPlot, MapPlotHover, MapRegion } from "@/components/maps/MapboxMap";
import { cn } from "@/lib/utils/cn";

// mapbox-gl is heavy (JS + a WebGL context + tiles), so it loads after the page, not with it.
const MapboxMap = dynamic(
  () => import("@/components/maps/MapboxMap").then((mod) => mod.MapboxMap),
  { ssr: false },
);

export type MapLegendLabels = { claimed: string; available: string };

type ExploreThailandMapProps = {
  /** Shared with the page so search and zoom controls can drive the map. */
  mapRef: RefObject<MapboxMapHandle | null>;
  regions: MapRegion[];
  onRegionClick: (regionId: string) => void;
  /** Plots of the picked region (empty while none is picked). */
  plots?: MapPlot[];
  onPlotClick?: (plotId: string) => void;
  onPlotHover?: (hover: MapPlotHover | null) => void;
  /** Drawn over the map, positioned against its frame (e.g. the plot card). */
  overlay?: ReactNode;
  legendLabels?: MapLegendLabels;
  /** Replaces the frame's size classes. */
  frameClassName?: string;
};

// Same entrance as the home map: starts as a globe over the Arabian Sea, then
// flies east and lands on Thailand. Leaving the viewport resets it to the globe.
const GLOBE_VIEW = { center: [70, 18] as [number, number], zoom: 2 };
// Wide enough to show every region pill, Chiang Mai down to Phuket.
export const THAILAND_VIEW = { center: [100.9, 13.4] as [number, number], zoom: 4.9 };
const FLY_DURATION_MS = 3200;
// Fly once the map is this visible, so the whole flight is actually seen.
const START_AT_VISIBLE = 0.4;

const DEFAULT_FRAME_CLASS = "aspect-[4/3] sm:aspect-[1217/580]";
const DEFAULT_LEGEND: MapLegendLabels = { claimed: "Claimed", available: "Available" };

export function ExploreThailandMap({
  mapRef,
  regions,
  onRegionClick,
  plots,
  onPlotClick,
  onPlotHover,
  overlay,
  legendLabels = DEFAULT_LEGEND,
  frameClassName = DEFAULT_FRAME_CLASS,
}: ExploreThailandMapProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  // Flight requested before the lazily loaded map was there; runs once it is.
  const pendingFlightRef = useRef<(() => void) | null>(null);
  const [landed, setLanded] = useState(false);
  const legend = [
    // The same colours the plots are drawn in (see `PLOT_STATUS_COLORS`).
    { label: legendLabels.claimed, color: "bg-[#d64242]" },
    { label: legendLabels.available, color: "bg-[#2cbf65]" },
  ];

  const setMapHandle = useCallback(
    (handle: MapboxMapHandle | null) => {
      mapRef.current = handle;
      const flight = pendingFlightRef.current;
      if (handle && flight) {
        pendingFlightRef.current = null;
        flight();
      }
    },
    [mapRef],
  );

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    let cancelled = false;
    // Bumped on every entry and exit, so a flight cut short by leaving (which
    // still resolves on `moveend`) never marks the map as landed.
    let run = 0;
    let inView = false;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (!entry.isIntersecting) {
          if (!inView) return;
          // Fully out of view: snap back to the globe so the next visit flies in again.
          inView = false;
          run += 1;
          pendingFlightRef.current = null;
          setLanded(false);
          void mapRef.current?.flyToView({ ...GLOBE_VIEW, duration: 0 });
          return;
        }
        if (inView || entry.intersectionRatio < START_AT_VISIBLE) return;
        inView = true;
        const id = ++run;
        const fly = () => {
          if (cancelled || id !== run) return;
          const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
          const flight = mapRef.current?.flyToView({
            ...THAILAND_VIEW,
            duration: reducedMotion ? 0 : FLY_DURATION_MS,
            curve: 1.4,
          });
          void Promise.resolve(flight).then(() => {
            if (!cancelled && id === run) setLanded(true);
          });
        };
        if (mapRef.current) {
          fly();
        } else {
          pendingFlightRef.current = fly;
        }
      },
      { threshold: [0, START_AT_VISIBLE] },
    );
    observer.observe(frame);

    return () => {
      cancelled = true;
      pendingFlightRef.current = null;
      observer.disconnect();
    };
  }, [mapRef]);

  return (
    <div ref={frameRef} className={cn("relative w-full overflow-hidden rounded-[1.35rem]", frameClassName)}>
      <MapboxMap
        ref={setMapHandle}
        className="h-full min-h-0"
        initialCenter={GLOBE_VIEW.center}
        initialZoom={GLOBE_VIEW.zoom}
        projection="globe"
        regions={regions}
        onRegionClick={onRegionClick}
        plots={plots}
        onPlotClick={onPlotClick}
        onPlotHover={onPlotHover}
      />
      <div
        className={cn(
          "pointer-events-none absolute right-2 top-2 z-20 flex origin-top-right items-center gap-2.5 rounded-full bg-white/95 px-3 py-1.5 text-[10px] sm:gap-4 sm:px-4 sm:py-2 text-[#171717] shadow-[0_4px_12px_rgba(11,31,77,0.12)] sm:right-4 sm:top-4",
          landed ? "legend-pop" : "opacity-0",
        )}
      >
        {legend.map((item, index) => (
          <span
            key={item.color}
            className={cn("flex items-center gap-1.5", landed ? "legend-pop" : "opacity-0")}
            // The pill pops first, then each chip in turn.
            style={landed ? { animationDelay: `${150 + index * 120}ms` } : undefined}
          >
            <i className={cn("h-2 w-2 rounded-full", item.color)} />
            {item.label}
          </span>
        ))}
      </div>
      {overlay}
    </div>
  );
}
