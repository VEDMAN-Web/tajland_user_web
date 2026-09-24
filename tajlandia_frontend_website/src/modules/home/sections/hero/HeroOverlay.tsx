"use client";

import { Button } from "@/components/ui/Button";
import type { HomePageContent } from "../../types/home.types";
import type { HeroPlot } from "./data/heroStoryData";
import { rangeAlpha } from "./heroAnimationConfig";

type HeroOverlayProps = {
  content: HomePageContent["hero"];
  progress: number;
  plot: HeroPlot;
};

function introOpacity(progress: number): number {
  return 1 - rangeAlpha(progress, 0.04, 0.14);
}

function mapCopyOpacity(progress: number): number {
  return Math.min(
    rangeAlpha(progress, 0.22, 0.32),
    1 - rangeAlpha(progress, 0.4, 0.48),
  );
}

function regionCopyOpacity(progress: number): number {
  return Math.min(
    rangeAlpha(progress, 0.42, 0.5),
    1 - rangeAlpha(progress, 0.56, 0.64),
  );
}

function plotCardOpacity(progress: number): number {
  return Math.min(
    rangeAlpha(progress, 0.62, 0.72),
    1 - rangeAlpha(progress, 0.86, 0.93),
  );
}

function claimOpacity(progress: number): number {
  return Math.min(
    rangeAlpha(progress, 0.74, 0.82),
    1 - rangeAlpha(progress, 0.88, 0.94),
  );
}

function finaleOpacity(progress: number): number {
  return rangeAlpha(progress, 0.88, 0.96);
}

export function HeroOverlay({ content, progress, plot }: HeroOverlayProps) {
  const intro = introOpacity(progress);
  const mapCopy = mapCopyOpacity(progress);
  const regionCopy = regionCopyOpacity(progress);
  const plotCard = plotCardOpacity(progress);
  const claim = claimOpacity(progress);
  const finale = finaleOpacity(progress);

  const showIntro = intro > 0.03;
  const showFinale = finale > 0.03;
  const showPlot = plotCard > 0.05;

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {/* Intro — brand editorial */}
      <div
        className={`absolute inset-0 flex flex-col items-center px-5 pb-16 pt-[14vh] text-center sm:px-8 sm:pt-[16vh] md:pt-[18vh] ${
          showIntro ? "pointer-events-auto" : "pointer-events-none"
        }`}
        style={{
          opacity: intro,
          transform: `translate3d(0, ${(1 - intro) * 28}px, 0)`,
        }}
        aria-hidden={!showIntro}
      >
        <div className="w-full max-w-[760px] text-navy">
          <h1 className="font-[family-name:var(--font-playfair-display)] text-[68px] font-semibold leading-[1.04] tracking-[-0.055em] max-[767px]:text-[48px]">
            <span className="block">{content.title}</span>
            <span className="block">
              {content.titleContinue ? `${content.titleContinue} ` : null}
              <span className="italic text-brand-red">{content.titleAccent}</span>
            </span>
          </h1>
          {content.subtitle ? (
            <p className="mx-auto mt-6 max-w-[780px] font-[family-name:var(--font-manrope)] text-[24px] font-normal leading-[1.35] text-[#718096] max-[767px]:text-[17px]">
              {content.subtitle}
            </p>
          ) : null}
          {content.cta ? (
            <Button
              href={content.cta.href}
              size="sm"
              className="mt-8 h-14 w-[222px] rounded-full bg-navy px-6 py-3 text-white hover:bg-[#13285f]"
            >
              {content.cta.label}
            </Button>
          ) : null}
        </div>
      </div>

      <p
        className="absolute inset-x-0 top-[12vh] px-5 text-center font-[family-name:var(--font-playfair-display)] text-[28px] font-semibold tracking-[-0.03em] text-navy sm:text-[40px]"
        style={{ opacity: mapCopy }}
        aria-hidden={mapCopy < 0.05}
      >
        Enter the map of{" "}
        <span className="italic text-brand-red">Thailand</span>
      </p>

      <p
        className="absolute inset-x-0 top-[11vh] px-5 text-center font-[family-name:var(--font-manrope)] text-sm uppercase tracking-[0.22em] text-navy/55"
        style={{ opacity: regionCopy }}
        aria-hidden={regionCopy < 0.05}
      >
        Discover destinations
      </p>

      <div
        className={`absolute bottom-[16%] left-1/2 w-[min(92vw,340px)] -translate-x-1/2 ${
          showPlot ? "pointer-events-auto" : "pointer-events-none"
        }`}
        style={{
          opacity: plotCard,
          transform: `translate(-50%, ${(1 - plotCard) * 24}px)`,
        }}
        aria-hidden={!showPlot}
      >
        <article className="rounded-2xl border border-white/70 bg-white/93 p-5 text-left shadow-[0_24px_60px_rgba(11,31,77,0.16)] backdrop-blur-md">
          <div className="flex items-center gap-2">
            {plot.badge ? (
              <span className="rounded bg-[#fff4c6] px-1.5 py-0.5 text-[9px] font-medium text-[#c19a16]">
                {plot.badge}
              </span>
            ) : null}
            <span className="text-[11px] text-[#aab2bd]">{plot.id}</span>
          </div>
          <h2 className="mt-2 font-[family-name:var(--font-playfair-display)] text-[22px] font-semibold text-navy">
            {plot.name}
          </h2>
          <p className="mt-1 font-[family-name:var(--font-manrope)] text-[13px] text-[#718096]">
            {plot.region} · {plot.rai} Rai · ${plot.amount.toFixed(2)} / Rai
          </p>
          <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-brand-red">
            {plot.availability === "available" ? "Available" : plot.availability}
          </p>
        </article>
      </div>

      <p
        className="absolute inset-x-0 top-[14vh] px-5 text-center font-[family-name:var(--font-playfair-display)] text-[32px] font-semibold tracking-[-0.03em] text-navy sm:text-[44px]"
        style={{ opacity: claim }}
        aria-hidden={claim < 0.05}
      >
        Your piece of <span className="italic text-brand-red">Thailand</span>
      </p>

      <div
        className={`absolute inset-0 flex flex-col items-center justify-center px-5 text-center ${
          showFinale ? "pointer-events-auto" : "pointer-events-none"
        }`}
        style={{
          opacity: finale,
          transform: `translate3d(0, ${(1 - finale) * 18}px, 0)`,
        }}
        aria-hidden={!showFinale}
      >
        <div className="w-full max-w-[760px] text-navy">
          <h2 className="font-[family-name:var(--font-playfair-display)] text-[52px] font-semibold leading-[1.05] tracking-[-0.05em] max-[767px]:text-[36px]">
            <span className="block">{content.title}</span>
            <span className="block">
              {content.titleContinue ? `${content.titleContinue} ` : null}
              <span className="italic text-brand-red">{content.titleAccent}</span>
            </span>
          </h2>
          {content.cta ? (
            <Button
              href={content.cta.href}
              size="sm"
              className="mt-8 h-14 w-[222px] rounded-full bg-navy px-6 py-3 text-white hover:bg-[#13285f]"
            >
              {content.cta.label}
            </Button>
          ) : null}
        </div>
      </div>

      <p
        className="absolute bottom-8 left-1/2 -translate-x-1/2 font-[family-name:var(--font-manrope)] text-[11px] uppercase tracking-[0.22em] text-navy/40"
        style={{ opacity: Math.max(0, intro - 0.2) }}
        aria-hidden
      >
        Scroll to explore
      </p>
    </div>
  );
}
