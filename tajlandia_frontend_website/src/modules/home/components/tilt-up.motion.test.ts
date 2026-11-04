import { describe, expect, it } from "vitest";
import {
  tiltUpExitProgress,
  tiltUpMotion,
  tiltUpProgress,
  tiltUpTransform,
} from "./tilt-up.motion";

describe("tiltUpProgress", () => {
  it("is 0 while the element is still below the viewport", () => {
    expect(tiltUpProgress(900, 800)).toBe(0);
    expect(tiltUpProgress(800, 800)).toBe(0);
  });

  it("grows as the element rises and caps at 1", () => {
    expect(tiltUpProgress(500, 800)).toBeCloseTo(0.5);
    expect(tiltUpProgress(200, 800)).toBe(1);
    expect(tiltUpProgress(-400, 800)).toBe(1);
  });

  it("treats an empty viewport as fully revealed", () => {
    expect(tiltUpProgress(0, 0)).toBe(1);
  });
});

describe("tiltUpExitProgress", () => {
  it("is 0 while the element's bottom is still low in the viewport", () => {
    expect(tiltUpExitProgress(900, 800)).toBe(0);
    expect(tiltUpExitProgress(480, 800)).toBe(0);
  });

  it("grows as the bottom rises to the top and caps at 1", () => {
    expect(tiltUpExitProgress(240, 800)).toBeCloseTo(0.5);
    expect(tiltUpExitProgress(0, 800)).toBe(1);
    expect(tiltUpExitProgress(-200, 800)).toBe(1);
  });

  it("treats an empty viewport as not leaving", () => {
    expect(tiltUpExitProgress(0, 0)).toBe(0);
  });
});

describe("tiltUpMotion", () => {
  it("starts lying back, smaller, lower and off to the right", () => {
    expect(tiltUpMotion(0)).toEqual({ rotateX: 32, scale: 0.8, x: 100, y: 80 });
  });

  it("ends upright at full size", () => {
    const motion = tiltUpMotion(1);
    expect(motion.rotateX).toBeCloseTo(0);
    expect(motion.scale).toBeCloseTo(1);
    expect(motion.x).toBeCloseTo(0);
    expect(motion.y).toBeCloseTo(0);
  });

  it("slides out to the left as it exits", () => {
    expect(tiltUpMotion(1, 1).x).toBeCloseTo(-100);
    expect(tiltUpMotion(1, 1).scale).toBeCloseTo(1);
  });

  it("clamps progress outside 0..1", () => {
    expect(tiltUpMotion(-1)).toEqual(tiltUpMotion(0));
    expect(tiltUpMotion(2)).toEqual(tiltUpMotion(1));
    expect(tiltUpMotion(1, 2)).toEqual(tiltUpMotion(1, 1));
  });
});

describe("tiltUpTransform", () => {
  it("builds a perspective transform", () => {
    expect(tiltUpTransform({ rotateX: 10, scale: 0.9, x: 5, y: 20 })).toBe(
      "perspective(1400px) translate3d(5.000%, 20.00px, 0) rotateX(10.000deg) scale(0.9000)",
    );
  });
});
