// Pure scroll math for the scroll-linked "zoom in / zoom out" of the CTA card.
// Kept free of DOM access so it can be unit tested.

import { clamp, easeInCubic, easeOutCubic } from "./hero-film.motion";

/** Progress where the zoom-in finishes and the zoom-out starts. */
const ENTER_END = 0.42;
const EXIT_START = 0.62;

/**
 * 0 while the element's top is at the viewport bottom, 0.5 when it is centred,
 * 1 once its bottom has left the viewport top.
 */
export function zoomProgress(elementTop: number, elementHeight: number, viewportHeight: number) {
  const distance = viewportHeight + elementHeight;
  if (distance <= 0) {
    return 0.5;
  }
  return clamp((viewportHeight - elementTop) / distance);
}

export type ZoomMotion = {
  scale: number;
  y: number;
  opacity: number;
};

/** Small and low at 0 → full size while centred → slightly smaller and lifted at 1. */
export function zoomMotion(progress: number): ZoomMotion {
  const p = clamp(progress);
  const enter = easeOutCubic(clamp(p / ENTER_END));
  const exit = easeInCubic(clamp((p - EXIT_START) / (1 - EXIT_START)));
  return {
    scale: 0.65 + 0.35 * enter - 0.1 * exit,
    y: 60 * (1 - enter) - 40 * exit,
    opacity: 0.35 + 0.65 * enter,
  };
}

export function zoomTransform({ scale, y }: ZoomMotion) {
  return `translate3d(0, ${y.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
}
