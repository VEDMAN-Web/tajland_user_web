"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";

export const PLOT_PLACEHOLDER_IMAGE = "/images/explore/place-placeholder.svg";

// Zone name colour on the white badge over the photo.
const TIER_BADGES: Record<string, string> = {
  ICON: "text-[#b8891a]",
  POPULAR: "text-[#16807f]",
  STANDARD: "text-navy",
};
// Glass tint per zone: card wash, border and the corner glow.
const TIER_THEMES: Record<string, { card: string; border: string; glow: string }> = {
  ICON: { card: "bg-linear-to-br from-[#fff3cf] via-[#fffaea] to-white", border: "border-[#f2dd9c]", glow: "bg-[radial-gradient(circle,rgba(245,197,66,0.42),transparent_68%)]" },
  POPULAR: { card: "bg-linear-to-br from-[#d9f5e5] via-[#f1fbf5] to-white", border: "border-[#b9e7cc]", glow: "bg-[radial-gradient(circle,rgba(44,191,101,0.34),transparent_68%)]" },
  STANDARD: { card: "bg-linear-to-br from-[#dce9ff] via-[#f1f6ff] to-white", border: "border-[#c3d6f6]", glow: "bg-[radial-gradient(circle,rgba(79,140,240,0.34),transparent_68%)]" },
};
const STANDARD_THEME = TIER_THEMES.STANDARD as (typeof TIER_THEMES)[string];

export type OwnedPlotCardProps = {
  title: string;
  /** Shown on the photo's top right. */
  plotCode: string;
  /** Zone type: "ICON", "POPULAR" or "STANDARD" (any case). */
  tier: string;
  location?: string;
  /** Photos to slide through; empty shows the placeholder. */
  images: string[];
  /** Two or three label / value pairs; the first is drawn in red. */
  stats: { label: string; value: string }[];
  mapHref: string | null;
  certificateUrl: string | null;
  t: (source: string) => string;
};

/**
 * A plot the user (or a leaderboard owner) owns: zone-tinted glass card with a photo
 * slider, key figures, and View Map / View Certificate. Used by My Land and the
 * leaderboard owner page, so both look the same.
 */
export function OwnedPlotCard({ title, plotCode, tier: tierName, location, images, stats, mapHref, certificateUrl, t }: OwnedPlotCardProps) {
  const tier = tierName.toUpperCase();
  const tierLabel = tier.charAt(0) + tier.slice(1).toLowerCase();
  const theme = TIER_THEMES[tier] ?? STANDARD_THEME;
  const compact = stats.length > 2;
  const buttonBase =
    "inline-flex h-10 items-center gap-2 rounded-full font-manrope text-[13px] font-medium transition-colors";
  const arrow = (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5 motion-reduce:transition-none"
    >
      <path d="M3 8h10m-4-4 4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  return (
    // Home-style card with the zone's glass tint (as on the Explore Map list), lifting on hover.
    <article
      className={`group relative isolate flex h-full min-w-0 flex-col rounded-[20px] border p-3 shadow-[0_1px_2px_rgba(11,31,77,0.05),inset_0_1px_0_rgba(255,255,255,0.9)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_30px_-20px_rgba(11,31,77,0.35),inset_0_1px_0_rgba(255,255,255,0.9)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${theme.card} ${theme.border}`}
    >
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[19px]">
        <span className={`absolute -right-12 -top-14 h-52 w-52 ${theme.glow}`} />
        <span className="absolute inset-0 bg-linear-to-br from-white/70 via-white/10 to-transparent" />
        {/* White shimmer: one diagonal sweep when the card is hovered. Only a transform, so
            nothing runs while idle. */}
        <span className="absolute inset-y-0 left-0 w-1/3 -translate-x-[130%] -skew-x-[20deg] bg-linear-to-r from-transparent via-white/80 to-transparent group-hover:translate-x-[430%] group-hover:transition-transform group-hover:duration-[900ms] group-hover:ease-out motion-reduce:hidden" />
      </span>
      <PlotGallery images={images} alt={title} t={t}>
        <span
          className={`absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 font-manrope text-[10px] font-semibold uppercase leading-none tracking-[0.06em] shadow-[0_2px_8px_rgba(11,31,77,0.18)] ${
            TIER_BADGES[tier] ?? TIER_BADGES.STANDARD
          }`}
        >
          {t(tierLabel)}
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-[#071536]/55 px-2.5 py-1 font-manrope text-[10px] font-semibold leading-none tracking-[0.06em] text-white">
          {plotCode}
        </span>
      </PlotGallery>
      <div className="flex flex-1 flex-col px-1.5 pt-4">
        <h3 className="truncate font-manrope text-[19px] font-semibold leading-6 tracking-[-0.02em] text-navy">{title}</h3>
        {location ? (
          <p className="mt-1 flex items-start gap-1.5 font-manrope text-[13px] leading-5 text-[#6b7785]">
            <PinIcon className="mt-[3px] h-3.5 w-3.5 shrink-0 text-[#8b939e]" />
            <span className="line-clamp-2">{location}</span>
          </p>
        ) : null}
        <div
          className={`mt-4 grid rounded-[12px] border border-white/80 bg-white/70 py-2.5 shadow-[0_1px_2px_rgba(11,31,77,0.04)] ${compact ? "grid-cols-3" : "grid-cols-2"}`}
        >
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={`min-w-0 ${compact ? "px-3" : "px-3.5"} ${index > 0 ? "border-l border-[#e6ebf3]" : ""}`}
            >
              <p className="truncate font-manrope text-[10px] font-medium uppercase tracking-[0.06em] text-[#8a94a3]">{stat.label}</p>
              <p
                className={`mt-1 truncate font-manrope font-semibold leading-5 ${compact ? "text-[14px]" : "text-[16px]"} ${index === 0 ? "text-brand-red" : "text-navy"}`}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
          {mapHref ? (
            <Link
              href={mapHref}
              className={`${buttonBase} group/btn cursor-pointer bg-navy px-4 text-white hover:bg-navy-deep`}
            >
              {t("View Map")}
              {arrow}
            </Link>
          ) : (
            <span aria-disabled="true" className={`${buttonBase} cursor-not-allowed bg-navy/40 px-4 text-white`}>
              {t("View Map")}
              {arrow}
            </span>
          )}
          {certificateUrl ? (
            <a
              href={certificateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`${buttonBase} cursor-pointer border border-[#e6e8ef] bg-white px-4 text-navy shadow-[0_1px_2px_rgba(11,31,77,0.06)] hover:border-navy/25 hover:bg-[#f5f7fb]`}
            >
              {t("View Certificate")}
            </a>
          ) : (
            <span
              aria-disabled="true"
              title={t("Certificate not ready yet")}
              className={`${buttonBase} cursor-not-allowed border border-[#e6e8ef] bg-white px-4 text-[#b0b7c0]`}
            >
              {t("View Certificate")}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

const SLIDE_INTERVAL_MS = 2800;

/**
 * The card's image. With several photos it slides through them on its own (while the card
 * is on screen), and the arrows / dots let you step through by hand, which restarts the
 * timer. Phones have no hover, so the arrows stay visible there.
 */
function PlotGallery({
  images,
  alt,
  t,
  children,
}: {
  images: string[];
  alt: string;
  t: (source: string) => string;
  children?: ReactNode;
}) {
  const count = images.length;
  const loop = count > 1;
  // To loop without rewinding, the track is [last, ...images, first]: sliding onto a copy at
  // either end, then (once the slide has finished) jumping to the real one without animation.
  const track = loop ? [images[count - 1] as string, ...images, images[0] as string] : [images[0] ?? PLOT_PLACEHOLDER_IMAGE];
  const firstPos = loop ? 1 : 0;
  const [view, setView] = useState({ pos: firstPos, animate: true });
  const frameRef = useRef<HTMLDivElement>(null);
  // Only cards in view run a timer (a long list shouldn't keep dozens ticking).
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
  const arrow =
    // Frosted glass: translucent white, light blur, thin bright rim and an inner highlight.
    "absolute top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/45 bg-white/20 text-white opacity-0 shadow-[0_4px_14px_rgba(7,21,54,0.28),inset_0_1px_0_rgba(255,255,255,0.55)] backdrop-blur-md outline-none transition duration-300 hover:scale-105 hover:bg-white/35 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-white/80 active:scale-95 group-hover:opacity-100 [@media(hover:none)]:opacity-100 motion-reduce:transition-none motion-reduce:hover:scale-100";

  return (
    <div
      ref={frameRef}
      className="relative aspect-[1.55] w-full overflow-hidden rounded-[14px] bg-[#eef1f5] shadow-[0_6px_16px_-8px_rgba(11,31,77,0.35)]"
    >
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
            <Image
              src={src}
              alt={position === firstPos ? alt : ""}
              fill
              sizes="(min-width: 1280px) 360px, (min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        ))}
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#071536]/45 via-transparent to-transparent" />
      {children}
      {count > 1 ? (
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
            className="pointer-events-none absolute bottom-2 right-2 z-10 inline-flex items-center gap-1 rounded-full border border-white/30 bg-[#071536]/55 px-2 py-1 font-manrope text-[11px] font-medium leading-none tabular-nums text-white"
          >
            <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3 w-3">
              <rect x="1.75" y="3.75" width="12.5" height="9.5" rx="2" fill="none" stroke="currentColor" strokeWidth="1.3" />
              <circle cx="8" cy="8.5" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.3" />
              <path d="M5.5 3.75 6.4 2.25h3.2l.9 1.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
            </svg>
            {current + 1}/{count}
          </span>
          <div aria-hidden="true" className="pointer-events-none absolute bottom-2.5 left-1/2 flex -translate-x-1/2 gap-1.5">
            {images.map((src, position) => (
              <span
                key={src}
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

function PinIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={className}>
      <path
        d="M8 14s4.5-4.1 4.5-7.2A4.5 4.5 0 0 0 8 2.3a4.5 4.5 0 0 0-4.5 4.5C3.5 9.9 8 14 8 14Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <circle cx="8" cy="6.7" r="1.4" fill="currentColor" />
    </svg>
  );
}
