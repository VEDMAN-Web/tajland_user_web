// Pure scroll math for the "screen tilt-up" reveal in WorldSection. Kept free of
// DOM access so it can be unit tested.

import { clamp, easeInCubic, easeOutCubic } from "./hero-film.motion";

/** How far (in viewport heights) the element travels while it stands up. */
const TRAVEL = 0.75;
/** Viewport fraction the element's bottom must rise above before it slides out. */
const EXIT_START = 0.6;
/** Horizontal offset (% of the element's width): starts fully off-screen right, leaves fully off-screen left. */
const SLIDE = 100;

/**
 * 0 while the element's top is still at/below the viewport bottom, 1 once it
 * has risen `TRAVEL` viewport heights from there.
 */
export function tiltUpProgress(elementTop: number, viewportHeight: number) {
  if (viewportHeight <= 0) {
    return 1;
  }
  return clamp((viewportHeight - elementTop) / (viewportHeight * TRAVEL));
}

/**
 * 0 until the element's bottom rises above `EXIT_START` of the viewport, 1 once
 * it has reached the viewport top.
 */
export function tiltUpExitProgress(elementBottom: number, viewportHeight: number) {
  if (viewportHeight <= 0) {
    return 0;
  }
  const start = viewportHeight * EXIT_START;
  return clamp((start - elementBottom) / start);
}

export type TiltUpMotion = {
  rotateX: number;
  scale: number;
  x: number;
  y: number;
};

/**
 * Lying back (tilted away, smaller, lower, off to the right) at 0 → upright,
 * full size and centred at 1. `exit` then slides it out to the left, so
 * scrolling down reads right → left and scrolling up left → right.
 */
export function tiltUpMotion(progress: number, exit = 0): TiltUpMotion {
  const t = easeOutCubic(clamp(progress));
  const out = easeInCubic(clamp(exit));
  return {
    rotateX: 32 * (1 - t),
    scale: 0.8 + 0.2 * t,
    x: SLIDE * (1 - t) - SLIDE * out,
    y: 80 * (1 - t),
  };
}

export function tiltUpTransform({ rotateX, scale, x, y }: TiltUpMotion) {
  return `perspective(1400px) translate3d(${x.toFixed(3)}%, ${y.toFixed(2)}px, 0) rotateX(${rotateX.toFixed(3)}deg) scale(${scale.toFixed(4)})`;
}
