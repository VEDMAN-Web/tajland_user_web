"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { MapboxMap, type MapboxMapHandle } from "@/components/maps/MapboxMap";
import { cn } from "@/lib/utils/cn";

type ExploreThailandMapProps = {
  /** Shared with the page so search and zoom controls can drive the map. */
  mapRef: RefObject<MapboxMapHandle | null>;
};

// Same entrance as the home map: starts as a globe over the Arabian Sea, then
// flies east and lands on Thailand. Leaving the viewport resets it to the globe.
const GLOBE_VIEW = { center: [70, 18] as [number, number], zoom: 2 };
const THAILAND_VIEW = { center: [101.1, 14.95] as [number, number], zoom: 7.2 };
const FLY_DURATION_MS = 3200;
// Fly once the map is this visible, so the whole flight is actually seen.
const START_AT_VISIBLE = 0.4;

const legend = [
  { label: "Claimed", color: "bg-[#e51d2a]" },
  { label: "Available", color: "bg-[#0b1f4d]" },
  { label: "Restricted", color: "bg-[#a9a9a9]" },
];

export function ExploreThailandMap({ mapRef }: ExploreThailandMapProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [landed, setLanded] = useState(false);

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
          setLanded(false);
          void mapRef.current?.flyToView({ ...GLOBE_VIEW, duration: 0 });
          return;
        }
        if (inView || entry.intersectionRatio < START_AT_VISIBLE) return;
        inView = true;
        const id = ++run;
        const reducedMotion = window.matchMedia?.(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        const flight = mapRef.current?.flyToView({
          ...THAILAND_VIEW,
          duration: reducedMotion ? 0 : FLY_DURATION_MS,
          curve: 1.4,
        });
        void Promise.resolve(flight).then(() => {
          if (!cancelled && id === run) setLanded(true);
        });
      },
      { threshold: [0, START_AT_VISIBLE] },
    );
    observer.observe(frame);

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [mapRef]);

  return (
    <div
      ref={frameRef}
      className="aspect-[1217/580] w-full overflow-hidden rounded-[1.35rem]"
    >
      <MapboxMap
        ref={mapRef}
        className="h-full min-h-0"
        initialCenter={GLOBE_VIEW.center}
        initialZoom={GLOBE_VIEW.zoom}
        projection="globe"
      />
      <div
        className={cn(
          "pointer-events-none absolute right-5 top-5 z-20 flex origin-top-right items-center gap-4 rounded-full bg-white/95 px-4 py-2 text-[10px] text-[#171717] shadow-[0_4px_12px_rgba(11,31,77,0.12)] sm:right-7 sm:top-7",
          landed ? "legend-pop" : "opacity-0",
        )}
      >
        {legend.map((item, index) => (
          <span
            key={item.label}
            className={cn(
              "flex items-center gap-1.5",
              landed ? "legend-pop" : "opacity-0",
            )}
            // The pill pops first, then each chip in turn.
            style={landed ? { animationDelay: `${150 + index * 120}ms` } : undefined}
          >
            <i className={cn("h-2 w-2 rounded-full", item.color)} />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
