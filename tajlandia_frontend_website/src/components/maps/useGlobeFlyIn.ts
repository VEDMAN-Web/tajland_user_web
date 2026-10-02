import { useEffect, useState, type RefObject } from "react";
import type { MapboxMapHandle } from "./MapboxMap";

type MapView = { center: [number, number]; zoom: number };

/** Starting view for a fly-in: a globe over the Arabian Sea. */
export const GLOBE_VIEW: MapView = { center: [70, 18], zoom: 2 };
/** Default landing view: mainland Thailand. */
export const THAILAND_VIEW: MapView = { center: [100.5, 14], zoom: 5.5 };

type GlobeFlyInOptions = {
  target?: MapView;
  durationMs?: number;
  /** Fly once the frame is this visible, so the whole flight is actually seen. */
  startAtVisible?: number;
};

/**
 * Flies a globe-projection map from `GLOBE_VIEW` to `target` when its frame
 * scrolls into view, and snaps back to the globe once it leaves, so every
 * visit replays the flight. Returns `true` once the map has landed.
 *
 * Render the map with `initialCenter={GLOBE_VIEW.center}`,
 * `initialZoom={GLOBE_VIEW.zoom}` and `projection="globe"`.
 */
export function useGlobeFlyIn(
  frameRef: RefObject<HTMLElement | null>,
  mapRef: RefObject<MapboxMapHandle | null>,
  { target = THAILAND_VIEW, durationMs = 3200, startAtVisible = 0.4 }: GlobeFlyInOptions = {},
) {
  const [landed, setLanded] = useState(false);
  const [targetLng, targetLat] = target.center;
  const targetZoom = target.zoom;

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
        if (inView || entry.intersectionRatio < startAtVisible) return;
        inView = true;
        const id = ++run;
        const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        const flight = mapRef.current?.flyToView({
          center: [targetLng, targetLat],
          zoom: targetZoom,
          duration: reducedMotion ? 0 : durationMs,
          curve: 1.4,
        });
        void Promise.resolve(flight).then(() => {
          if (!cancelled && id === run) setLanded(true);
        });
      },
      { threshold: [0, startAtVisible] },
    );
    observer.observe(frame);

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [frameRef, mapRef, targetLng, targetLat, targetZoom, durationMs, startAtVisible]);

  return landed;
}
