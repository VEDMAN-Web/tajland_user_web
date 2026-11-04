import { describe, expect, it } from "vitest";
import {
  blockMotion,
  frameLoadOrder,
  frameUrl,
  introMotion,
  motionToStyle,
  scrollProgress,
} from "./hero-film.motion";

describe("hero film motion", () => {
  it("maps section scroll to 0..1 progress", () => {
    expect(scrollProgress(0, 5000, 1000)).toBe(0);
    expect(scrollProgress(-2000, 5000, 1000)).toBe(0.5);
    expect(scrollProgress(-9000, 5000, 1000)).toBe(1);
    expect(scrollProgress(300, 5000, 1000)).toBe(0);
    expect(scrollProgress(-100, 800, 1000)).toBe(0);
    // Stage pinned 80px below a sticky header.
    expect(scrollProgress(80, 5000, 1000, 80)).toBe(0);
    expect(scrollProgress(-3920, 5000, 1000, 80)).toBe(1);
  });

  it("builds zero-padded, 1-based frame URLs", () => {
    expect(frameUrl("/images/f/frame-{frame}.webp", 0)).toBe("/images/f/frame-0001.webp");
    expect(frameUrl("/images/f/frame-{frame}.webp", 277)).toBe("/images/f/frame-0278.webp");
  });

  it("loads every frame exactly once, coarse frames first", () => {
    const order = frameLoadOrder(40);

    expect(order.slice(0, 3)).toEqual([0, 16, 32]);
    expect(new Set(order).size).toBe(40);
    expect([...order].sort((a, b) => a - b)).toEqual(Array.from({ length: 40 }, (_, i) => i));
  });

  it("fades the intro out early in the film", () => {
    expect(introMotion(0).opacity).toBe(1);
    expect(introMotion(0.07).opacity).toBeGreaterThan(0);
    expect(introMotion(0.2).opacity).toBe(0);
  });

  it("reveals a story block inside its range and hides it outside", () => {
    expect(blockMotion(0.1, 0.2, 0.5).opacity).toBe(0);
    expect(blockMotion(0.35, 0.2, 0.5).opacity).toBe(1);
    expect(blockMotion(0.35, 0.2, 0.5).y).toBe(0);
    expect(blockMotion(0.6, 0.2, 0.5).opacity).toBe(0);
  });

  it("keeps a held block visible at the end and staggers lines", () => {
    expect(blockMotion(1, 0.76, 1, { holdEnd: true }).opacity).toBe(1);
    expect(blockMotion(0.78, 0.76, 1, { lineDelay: 0.012 }).opacity).toBeLessThan(
      blockMotion(0.78, 0.76, 1).opacity,
    );
  });

  it("hides fully transparent layers from interaction", () => {
    expect(motionToStyle({ opacity: 0, y: 40, scale: 1, blur: 10 }).visibility).toBe("hidden");
    expect(motionToStyle({ opacity: 1, y: 0, scale: 1, blur: 0 }).filter).toBe("none");
  });
});
