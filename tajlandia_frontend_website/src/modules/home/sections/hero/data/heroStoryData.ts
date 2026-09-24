/**
 * Hero story data adapter.
 * Locations prefer homepage map pins. Plot fields mirror cart domain shape.
 */

import type { HomePageContent } from "../../../types/home.types";

export type HeroLocation = {
  id: string;
  label: string;
  /** Percent positions on the map layer (0–100). */
  left: number;
  top: number;
};

export type HeroPlotAvailability = "available" | "claimed" | "restricted";

export type HeroPlot = {
  id: string;
  name: string;
  region: string;
  rai: number;
  amount: number;
  availability: HeroPlotAvailability;
  image?: string;
  badge?: string;
};

export type HeroStoryData = {
  locations: HeroLocation[];
  featuredPlot: HeroPlot;
};

const FALLBACK_LOCATIONS: HeroLocation[] = [
  { id: "chiang-mai", label: "Chiang Mai", left: 42, top: 14 },
  { id: "bangkok", label: "Bangkok", left: 47, top: 44 },
  { id: "pattaya", label: "Pattaya", left: 60, top: 51 },
  { id: "phuket", label: "Phuket", left: 35, top: 88 },
];

/** MOCK — replace when plot APIs exist. */
export const HERO_STORY_PLOT: HeroPlot = {
  id: "PH-1024",
  name: "Seaview Ridge Plot",
  region: "Phuket",
  rai: 25,
  amount: 2.5,
  availability: "available",
  image: "/images/explore/phuket.jpg",
  badge: "ICON",
};

/** Homepage pin coords (~500×700) → percent on map frame. */
function pinToPercent(x: number, y: number): { left: number; top: number } {
  return {
    left: clamp((x / 500) * 100, 8, 92),
    top: clamp((y / 700) * 100, 8, 92),
  };
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function resolveHeroStoryData(
  pins?: HomePageContent["map"]["pins"],
): HeroStoryData {
  const locations: HeroLocation[] =
    pins && pins.length > 0
      ? pins.map((pin) => {
          const pos = pinToPercent(pin.x, pin.y);
          return {
            id: pin.id,
            label: pin.label,
            left: pos.left,
            top: pos.top,
          };
        })
      : FALLBACK_LOCATIONS;

  return {
    locations,
    featuredPlot: HERO_STORY_PLOT,
  };
}
