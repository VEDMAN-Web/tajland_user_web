"use client";

import Image from "next/image";
import type { RefObject } from "react";
import type { HeroStoryData } from "./data/heroStoryData";

type HeroCinematicStageProps = {
  landscapeSrc: string;
  landscapeAlt: string;
  mapSrc: string;
  regionSrc: string;
  story: HeroStoryData;
  landscapeRef: RefObject<HTMLDivElement | null>;
  mapRef: RefObject<HTMLDivElement | null>;
  regionRef: RefObject<HTMLDivElement | null>;
  pinsRef: RefObject<HTMLDivElement | null>;
  gridRef: RefObject<HTMLDivElement | null>;
  hazeRef: RefObject<HTMLDivElement | null>;
};

const PLOT_CELLS = Array.from({ length: 36 }, (_, i) => i);

/**
 * Photographic depth layers — Reposé-style continuous zoom/crossfade,
 * driven by GSAP ScrollTrigger (no low-poly WebGL).
 */
export function HeroCinematicStage({
  landscapeSrc,
  landscapeAlt,
  mapSrc,
  regionSrc,
  story,
  landscapeRef,
  mapRef,
  regionRef,
  pinsRef,
  gridRef,
  hazeRef,
}: HeroCinematicStageProps) {
  const featured = 22;

  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-[#c9dde8]" aria-hidden>
      {/* Soft sky wash */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#e8f3fa] via-[#d4e6f2] to-[#b7cfdc]" />

      {/* Scene 01–02: Thailand landscape — continuous scale on scroll */}
      <div
        ref={landscapeRef}
        className="absolute inset-[-8%] will-change-transform"
        style={{ transform: "scale(1) translate3d(0,0,0)" }}
      >
        <Image
          src={landscapeSrc}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <span className="sr-only">{landscapeAlt}</span>
      </div>

      {/* Atmospheric haze / depth veil */}
      <div
        ref={hazeRef}
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/50 via-transparent to-[#0b1f4d]/15 will-change-opacity"
      />

      {/* Scene 03: Thailand map reveal */}
      <div
        ref={mapRef}
        className="absolute inset-0 flex items-center justify-center will-change-transform"
        style={{ opacity: 0, transform: "scale(0.72) translate3d(0,8%,0)" }}
      >
        <div className="relative h-[min(88vh,820px)] w-[min(96vw,640px)]">
          <Image
            src={mapSrc}
            alt=""
            fill
            sizes="(max-width: 768px) 96vw, 640px"
            className="object-contain drop-shadow-[0_40px_80px_rgba(11,31,77,0.28)]"
          />
        </div>
      </div>

      {/* Scene 04: Region markers */}
      <div
        ref={pinsRef}
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        style={{ opacity: 0 }}
      >
        <div className="relative h-[min(88vh,820px)] w-[min(96vw,640px)]">
          {story.locations.map((loc) => (
            <div
              key={loc.id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${loc.left}%`, top: `${loc.top}%` }}
            >
              <span className="relative flex h-3 w-3">
                <span className="relative inline-flex h-3 w-3 rounded-full border-2 border-white bg-brand-red shadow-[0_2px_8px_rgba(200,30,30,0.35)]" />
              </span>
              <span className="absolute left-5 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-white/90 px-2.5 py-1 font-[family-name:var(--font-manrope)] text-[11px] font-medium text-navy shadow-[0_6px_18px_rgba(11,31,77,0.12)]">
                {loc.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Scene 05: Region aerial (Phuket) */}
      <div
        ref={regionRef}
        className="absolute inset-[-12%] will-change-transform"
        style={{ opacity: 0, transform: "scale(1.15) translate3d(0,0,0)" }}
      >
        <Image
          src={regionSrc}
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b1f4d]/35 via-transparent to-white/10" />
      </div>

      {/* Scene 06: Elegant plot grid over region */}
      <div
        ref={gridRef}
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        style={{ opacity: 0 }}
      >
        <div className="grid w-[min(88vw,420px)] grid-cols-6 gap-1.5 sm:gap-2">
          {PLOT_CELLS.map((i) => {
            const selected = i === featured;
            return (
              <div
                key={i}
                className={
                  selected
                    ? "aspect-square rounded-[4px] border-2 border-brand-red bg-white/55 shadow-[0_12px_28px_rgba(200,30,30,0.28)] ring-2 ring-brand-red/30"
                    : "aspect-square rounded-[4px] border border-white/50 bg-white/20 backdrop-blur-[1px]"
                }
                style={
                  selected
                    ? { transform: "translateY(-6px) scale(1.06)" }
                    : undefined
                }
              />
            );
          })}
        </div>
      </div>

      {/* Bottom vignette for typography legibility */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-white/70 via-white/20 to-transparent" />
    </div>
  );
}
