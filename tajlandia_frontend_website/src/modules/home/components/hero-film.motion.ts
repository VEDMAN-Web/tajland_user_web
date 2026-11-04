// Pure scroll/animation math for the hero film. Kept free of DOM access so it
// can be unit tested and reused by HeroFilm.tsx.

export function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

export function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

export function easeInCubic(t: number) {
  return t * t * t;
}

/**
 * Progress (0..1) of a tall section scrolled past a sticky stage of `stageHeight`
 * pinned `stickyTop` px from the viewport top (e.g. below a sticky header).
 */
export function scrollProgress(
  sectionTop: number,
  sectionHeight: number,
  stageHeight: number,
  stickyTop = 0,
) {
  const travel = sectionHeight - stageHeight;
  return travel <= 0 ? 0 : clamp((stickyTop - sectionTop) / travel);
}

export function frameUrl(framePath: string, frameIndex: number) {
  return framePath.replace("{frame}", String(frameIndex + 1).padStart(4, "0"));
}

/**
 * Coarse-to-fine load order: every 16th frame first, then 8th, 4th, 2nd, 1st.
 * Early scrolling always has a nearby frame to show while the rest stream in.
 */
export function frameLoadOrder(frameCount: number) {
  const order: number[] = [];
  const seen = new Set<number>();
  for (const step of [16, 8, 4, 2, 1]) {
    for (let index = 0; index < frameCount; index += step) {
      if (!seen.has(index)) {
        seen.add(index);
        order.push(index);
      }
    }
  }
  return order;
}

export type LayerMotion = {
  opacity: number;
  y: number;
  scale: number;
  blur: number;
};

const HIDDEN_BELOW: LayerMotion = { opacity: 0, y: 40, scale: 1, blur: 10 };

/** Intro heading: fully visible at the top, lifts, grows and blurs away. */
export function introMotion(progress: number, exitEnd = 0.1): LayerMotion {
  const t = easeInCubic(clamp(progress / exitEnd));
  return { opacity: 1 - t, y: -70 * t, scale: 1 + 0.05 * t, blur: 8 * t };
}

/**
 * A story block (or one of its lines) inside [from, to]: rises in with a blur,
 * holds, then drifts up and out. `lineDelay` staggers lines on the way in.
 * With `holdEnd` the block stays once revealed (used for the closing CTA).
 */
export function blockMotion(
  progress: number,
  from: number,
  to: number,
  { lineDelay = 0, holdEnd = false }: { lineDelay?: number; holdEnd?: boolean } = {},
): LayerMotion {
  const span = to - from;
  if (span <= 0) {
    return HIDDEN_BELOW;
  }
  const fade = Math.min(0.08, span * 0.3);
  const enter = easeOutCubic(clamp((progress - from - lineDelay) / fade));
  const exit = holdEnd ? 0 : easeInCubic(clamp((progress - (to - fade)) / fade));

  return {
    opacity: enter * (1 - exit),
    y: 40 * (1 - enter) - 40 * exit,
    scale: 1,
    blur: 10 * (1 - enter) + 6 * exit,
  };
}

export function motionToStyle({ opacity, y, scale, blur }: LayerMotion) {
  return {
    opacity: opacity.toFixed(3),
    transform: `translate3d(0, ${y.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`,
    filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : "none",
    visibility: opacity < 0.01 ? "hidden" : "visible",
  };
}
