"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { MapboxMapHandle } from "@/components/maps/MapboxMap";
import { cn } from "@/lib/utils/cn";

// mapbox-gl is heavy (JS + a WebGL context + tiles), so it is fetched and
// created only when the section gets close to the viewport.
const MapboxMap = dynamic(
  () => import("@/components/maps/MapboxMap").then((mod) => mod.MapboxMap),
  { ssr: false },
);
import type { HomePageContent } from "../types/home.types";

type ThailandMapProps = {
  pins: HomePageContent["map"]["pins"];
};

// Starts as a globe over the Arabian Sea, then flies east and lands on Thailand.
// Replays on every visit: leaving the viewport resets it to the globe.
const GLOBE_VIEW = { center: [70, 18] as [number, number], zoom: 2 };
const THAILAND_VIEW = { center: [101.1, 14.95] as [number, number], zoom: 7.2 };
const FLY_DURATION_MS = 3200;
// Fly once the map is this visible, so the whole flight is actually seen.
const START_AT_VISIBLE = 0.4;
// Mount the map about a screen ahead, so it is usually ready before it shows.
const MOUNT_MARGIN = "100% 0px";

const legend = [
  { label: "Claimed", color: "bg-[#e51d2a]" },
  { label: "Available", color: "bg-[#0b1f4d]" },
  { label: "Restricted", color: "bg-[#a9a9a9]" },
];

export function ThailandMap({ pins }: ThailandMapProps) {
  void pins;
  const frameRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMapHandle | null>(null);
  // Flight requested before the lazily loaded map was there; runs once it is.
  const pendingFlightRef = useRef<(() => void) | null>(null);
  const [nearView, setNearView] = useState(false);
  const [landed, setLanded] = useState(false);

  const setMapHandle = useCallback((handle: MapboxMapHandle | null) => {
    mapRef.current = handle;
    const flight = pendingFlightRef.current;
    if (handle && flight) {
      pendingFlightRef.current = null;
      flight();
    }
  }, []);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setNearView(true);
          observer.disconnect();
        }
      },
      { rootMargin: MOUNT_MARGIN },
    );
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

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
  }, []);

  return (
    <div
      ref={frameRef}
      className="relative h-[clamp(300px,48vw,580px)] min-h-0 w-full overflow-hidden rounded-[1.5rem]"
    >
      {nearView ? (
        <MapboxMap
          ref={setMapHandle}
          className="h-full min-h-0"
          initialCenter={GLOBE_VIEW.center}
          initialZoom={GLOBE_VIEW.zoom}
          projection="globe"
        />
      ) : (
        <div className="h-full w-full" aria-label="Interactive Thailand map" />
      )}
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
