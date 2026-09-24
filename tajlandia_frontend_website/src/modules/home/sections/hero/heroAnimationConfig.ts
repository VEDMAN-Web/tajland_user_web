/**
 * Scroll timeline for the cinematic photographic hero.
 * Progress is scrubbed 0 → 1 by GSAP ScrollTrigger.
 */

export const HERO_SCROLL = {
  desktopTrackVh: 380,
  mobileTrackVh: 260,
} as const;

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function rangeAlpha(progress: number, start: number, end: number): number {
  if (end <= start) return progress >= end ? 1 : 0;
  return clamp01((progress - start) / (end - start));
}
