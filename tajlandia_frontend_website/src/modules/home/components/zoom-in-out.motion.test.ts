import { describe, expect, it } from "vitest";
import { zoomMotion, zoomProgress, zoomTransform } from "./zoom-in-out.motion";

describe("zoomProgress", () => {
  it("is 0 while the element is still below the viewport", () => {
    expect(zoomProgress(800, 400, 800)).toBe(0);
    expect(zoomProgress(1000, 400, 800)).toBe(0);
  });

  it("is 0.5 when the element is centred", () => {
    expect(zoomProgress(200, 400, 800)).toBeCloseTo(0.5);
  });

  it("caps at 1 once the element has left the top", () => {
    expect(zoomProgress(-400, 400, 800)).toBe(1);
    expect(zoomProgress(-900, 400, 800)).toBe(1);
  });

  it("treats an empty viewport as centred", () => {
    expect(zoomProgress(0, 0, 0)).toBe(0.5);
  });
});

describe("zoomMotion", () => {
  it("starts zoomed out, lower and faded", () => {
    expect(zoomMotion(0)).toEqual({ scale: 0.65, y: 60, opacity: 0.35 });
  });

  it("is full size while centred", () => {
    const motion = zoomMotion(0.5);
    expect(motion.scale).toBeCloseTo(1);
    expect(motion.y).toBeCloseTo(0);
    expect(motion.opacity).toBeCloseTo(1);
  });

  it("zooms back out as it leaves the top", () => {
    const motion = zoomMotion(1);
    expect(motion.scale).toBeCloseTo(0.9);
    expect(motion.y).toBeCloseTo(-40);
    expect(motion.opacity).toBeCloseTo(1);
  });

  it("clamps progress outside 0..1", () => {
    expect(zoomMotion(-1)).toEqual(zoomMotion(0));
    expect(zoomMotion(2)).toEqual(zoomMotion(1));
  });
});

describe("zoomTransform", () => {
  it("builds a translate + scale transform", () => {
    expect(zoomTransform({ scale: 0.9, y: 20, opacity: 1 })).toBe(
      "translate3d(0, 20.00px, 0) scale(0.9000)",
    );
  });
});
