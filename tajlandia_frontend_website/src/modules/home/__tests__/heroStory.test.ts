import { describe, expect, it } from "vitest";
import { clamp01, rangeAlpha } from "../sections/hero/heroAnimationConfig";
import { resolveHeroStoryData } from "../sections/hero/data/heroStoryData";
import { homePageContent } from "../data/home.mock";

describe("heroAnimationConfig", () => {
  it("clamps and blends progress windows", () => {
    expect(clamp01(2)).toBe(1);
    expect(rangeAlpha(0.25, 0.2, 0.3)).toBeCloseTo(0.5);
  });
});

describe("resolveHeroStoryData", () => {
  it("uses homepage map pins when provided", () => {
    const story = resolveHeroStoryData(homePageContent.map.pins);
    expect(story.locations.map((l) => l.id)).toEqual(
      homePageContent.map.pins.map((p) => p.id),
    );
    expect(story.featuredPlot.id).toMatch(/^PH-/);
    expect(story.featuredPlot).toHaveProperty("rai");
    expect(story.locations[0]).toHaveProperty("left");
    expect(story.locations[0]).toHaveProperty("top");
  });
});
