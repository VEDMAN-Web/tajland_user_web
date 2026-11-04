// Pure timeline for the How It Works progress line. Kept free of DOM access so
// it can be unit tested; HowItWorksSection feeds it scroll positions and time.
//
// 1. Scroll: scrolling down draws the line from step 1 to the last step and
//    pops each step in as the line reaches it; scrolling back up leaves it
//    where it got to.
// 2. Loop: once fully drawn, the line plays on its own — rest on step 1 →
//    glide to step 2 → rest → … → hold on the last step → fade out → repeat.

import { clamp } from "./hero-film.motion";

export const LINE_SCROLL = {
  /** The line starts when the step row's top reaches this fraction of the viewport. */
  start: 0.85,
  /** ...and reaches the last step when the row's top is up at this fraction. */
  end: 0.4,
  /** Steps pop in slightly before the line head arrives, so they land together. */
  revealLead: 0.04,
};

export type LineState = {
  /** 0..1 along the track. */
  progress: number;
  /** 0..1 opacity of the drawn line and its head. */
  opacity: number;
  /** Index of the step the line has reached. */
  activeStep: number;
  /** How many steps (from the first) are revealed. */
  revealedSteps: number;
};

/**
 * Unclamped scroll progress of the step row: below 0 before the line starts,
 * above 1 once it has finished.
 */
export function lineScrollProgress(rowTop: number, viewportHeight: number) {
  const { start, end } = LINE_SCROLL;
  return (viewportHeight * start - rowTop) / (viewportHeight * (start - end));
}

/**
 * Progress only moves forward: scrolling back up keeps the line and steps where
 * they got to. It resets once the row has dropped fully below the viewport, so
 * the next visit draws it again.
 */
export function heldProgress(
  previous: number,
  rawProgress: number,
  rowBelowViewport: boolean,
) {
  return rowBelowViewport ? rawProgress : Math.max(previous, rawProgress);
}

/** Line state for an (unclamped) scroll progress. */
export function lineStateFor(rawProgress: number, stepCount: number): LineState {
  const segments = stepCount - 1;
  if (segments < 1) {
    return { progress: 0, opacity: 0, activeStep: 0, revealedSteps: 0 };
  }

  const progress = clamp(rawProgress);
  // Step `i` sits at i / segments along the track.
  const activeStep = Math.min(segments, Math.floor(progress * segments + 1e-6));
  let revealedSteps = 0;
  for (let step = 0; step < stepCount; step += 1) {
    const threshold = step === 0 ? 0 : step / segments - LINE_SCROLL.revealLead;
    if (rawProgress >= threshold) {
      revealedSteps = step + 1;
    }
  }

  return { progress, opacity: rawProgress > 0 ? 1 : 0, activeStep, revealedSteps };
}

export const LINE_TIMING = {
  travel: 1100,
  dwell: 750,
  finalHold: 900,
  fadeOut: 600,
};

export function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function lineCycleDuration(stepCount: number) {
  const segments = Math.max(stepCount - 1, 0);
  const { travel, dwell, finalHold, fadeOut } = LINE_TIMING;
  return dwell + segments * (travel + dwell) + finalHold + fadeOut;
}

/**
 * Where the loop picks up after the scroll has drawn the whole line: at the
 * hold on the last step, so the full line fades out instead of jumping back.
 */
export function loopEntryElapsed(stepCount: number) {
  const { finalHold, fadeOut } = LINE_TIMING;
  return lineCycleDuration(stepCount) - finalHold - fadeOut;
}

/** Line state `elapsed` ms into the (looping) cycle. Every step stays revealed. */
export function lineStateAt(elapsed: number, stepCount: number): LineState {
  const segments = stepCount - 1;
  if (segments < 1) {
    return { progress: 0, opacity: 0, activeStep: 0, revealedSteps: 0 };
  }

  const revealedSteps = stepCount;
  const { travel, dwell, finalHold, fadeOut } = LINE_TIMING;
  let t = Math.max(elapsed, 0) % lineCycleDuration(stepCount);

  // Resting on step 1.
  if (t < dwell) {
    return { progress: 0, opacity: 1, activeStep: 0, revealedSteps };
  }
  t -= dwell;

  for (let segment = 0; segment < segments; segment += 1) {
    const from = segment / segments;
    const to = (segment + 1) / segments;
    if (t < travel) {
      const eased = easeInOutCubic(t / travel);
      return {
        progress: from + (to - from) * eased,
        opacity: 1,
        activeStep: segment,
        revealedSteps,
      };
    }
    t -= travel;
    if (t < dwell) {
      return { progress: to, opacity: 1, activeStep: segment + 1, revealedSteps };
    }
    t -= dwell;
  }

  if (t < finalHold) {
    return { progress: 1, opacity: 1, activeStep: segments, revealedSteps };
  }
  t -= finalHold;

  return {
    progress: 1,
    opacity: 1 - clamp(t / fadeOut),
    activeStep: segments,
    revealedSteps,
  };
}
