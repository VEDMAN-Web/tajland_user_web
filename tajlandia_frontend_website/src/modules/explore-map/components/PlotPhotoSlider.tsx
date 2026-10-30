"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { isAllowedRemoteImage } from "@/lib/config/remote-images";
import { cn } from "@/lib/utils/cn";
import type { Translate } from "../types/explore-filters.types";

const PLACEHOLDER_SRC = "/images/explore/place-placeholder.svg";
const SLIDE_INTERVAL_MS = 2800;

/** One photo; the local placeholder when missing, from a host we don't allow, or broken. */
function PlotImage({ src, alt }: { src: string | null | undefined; alt: string }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const usable = isAllowedRemoteImage(src) && failedSrc !== src;
  // Remote images can be slow; pulse until this one has loaded.
  const loading = usable && loadedSrc !== src;

  return (
    <Image
      src={usable ? src : PLACEHOLDER_SRC}
      alt={alt}
      fill
      sizes="(max-width: 640px) 100vw, 420px"
      unoptimized={!usable}
      onLoad={() => {
        if (usable) setLoadedSrc(src);
      }}
      onError={() => {
        if (usable) setFailedSrc(src);
      }}
      className={cn("object-cover", loading && "animate-pulse bg-[#eef1f5] motion-reduce:animate-none")}
    />
  );
}

// Same frosted-glass arrows as the My Land card; always visible on touch screens.
const arrow =
  "absolute top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/45 bg-white/20 text-white opacity-0 shadow-[0_4px_14px_rgba(7,21,54,0.28),inset_0_1px_0_rgba(255,255,255,0.55)] backdrop-blur-md outline-none transition duration-300 hover:scale-105 hover:bg-white/35 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-white/80 active:scale-95 group-hover:opacity-100 [@media(hover:none)]:opacity-100 motion-reduce:transition-none motion-reduce:hover:scale-100";

/**
 * The plot detail's photo header, same behaviour as the My Land card's gallery: with several
 * photos it slides through them on its own (while on screen), the arrows step by hand and
 * restart the timer, and a counter plus dots show where you are. `children` (Back, status)
 * sit on top. Give it `key={plot.id}` so another plot starts at its first photo.
 */
export function PlotPhotoSlider({
  photos,
  alt,
  t,
  children,
}: {
  photos: string[];
  alt: string;
  t: Translate;
  children?: ReactNode;
}) {
  const count = photos.length;
  const loop = count > 1;
  // To loop without rewinding, the track is [last, ...photos, first]: sliding onto a copy at
  // either end, then (once the slide has finished) jumping to the real one without animation.
  const track: (string | null)[] = loop
    ? [photos[count - 1] as string, ...photos, photos[0] as string]
    : [photos[0] ?? null];
  const firstPos = loop ? 1 : 0;
  const [view, setView] = useState({ pos: firstPos, animate: true });
  const frameRef = useRef<HTMLDivElement>(null);
  const [onScreen, setOnScreen] = useState(false);
  // Bumped by the arrows so the next automatic slide waits a full interval again.
  const [restart, setRestart] = useState(0);
  const current = loop ? (view.pos - 1 + count) % count : 0;

  const step = (direction: 1 | -1) => {
    setRestart((value) => value + 1);
    setView((value) => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        // No slide, so no end-of-slide to wait for: wrap straight away.
        return { pos: ((value.pos - 1 + direction + count) % count) + 1, animate: false };
      }
      const pos = value.pos + direction;
      return pos < 0 || pos > count + 1 ? value : { pos, animate: true };
    });
  };

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || !loop) return;
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry?.isIntersecting ?? false), {
      threshold: 0.4,
    });
    observer.observe(frame);
    return () => observer.disconnect();
  }, [loop]);

  useEffect(() => {
    if (!onScreen || !loop) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(
      () => setView((value) => (value.pos > count ? value : { pos: value.pos + 1, animate: true })),
      SLIDE_INTERVAL_MS,
    );
    return () => window.clearInterval(timer);
  }, [onScreen, loop, count, restart]);

  const settle = () =>
    setView((value) =>
      value.pos === count + 1 ? { pos: 1, animate: false } : value.pos === 0 ? { pos: count, animate: false } : value,
    );

  return (
    <div ref={frameRef} className="group relative h-[190px] w-full shrink-0 overflow-hidden bg-[#eef1f5]">
      <div
        className={`flex h-full motion-reduce:transition-none ${view.animate ? "transition-transform duration-500 ease-out" : ""}`}
        style={{ transform: `translateX(-${view.pos * 100}%)` }}
        onTransitionEnd={(event) => {
          if (event.target === event.currentTarget) settle();
        }}
      >
        {track.map((src, position) => (
          <div
            key={`${position}-${src}`}
            aria-hidden={loop && (position === 0 || position === count + 1) ? true : undefined}
            className="relative h-full w-full shrink-0"
          >
            <PlotImage src={src} alt={position === firstPos ? alt : ""} />
          </div>
        ))}
      </div>
      {/* Figma: dark gradient (60% -> 0% -> 20%). */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.6)_0%,rgba(0,0,0,0)_45%,rgba(0,0,0,0.2)_100%)]"
      />
      {children}
      {loop ? (
        <>
          <button type="button" aria-label={t("Previous image")} onClick={() => step(-1)} className={`${arrow} left-2`}>
            <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5 rotate-180">
              <path d="M3 8h10m-4-4 4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button type="button" aria-label={t("Next image")} onClick={() => step(1)} className={`${arrow} right-2`}>
            <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5">
              <path d="M3 8h10m-4-4 4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {/* Which photo of how many. */}
          <span
            aria-label={`${current + 1} / ${count}`}
            className="pointer-events-none absolute bottom-2 right-2 z-10 inline-flex items-center gap-1 rounded-full border border-white/30 bg-[#071536]/55 px-2 py-1 text-[11px] font-medium leading-none tabular-nums text-white"
          >
            <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3 w-3">
              <rect x="1.75" y="3.75" width="12.5" height="9.5" rx="2" fill="none" stroke="currentColor" strokeWidth="1.3" />
              <circle cx="8" cy="8.5" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.3" />
              <path d="M5.5 3.75 6.4 2.25h3.2l.9 1.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
            </svg>
            {current + 1}/{count}
          </span>
          <div aria-hidden="true" className="pointer-events-none absolute bottom-2.5 left-1/2 flex -translate-x-1/2 gap-1.5">
            {photos.map((src, position) => (
              <span
                key={`${position}-${src}`}
                className={`h-1.5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.35)] transition-all duration-300 ${
                  position === current ? "w-4 opacity-100" : "w-1.5 opacity-60"
                }`}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
