import { describe, expect, it } from "vitest";
import {
  LINE_SCROLL,
  LINE_TIMING,
  heldProgress,
  lineCycleDuration,
  lineScrollProgress,
  lineStateAt,
  lineStateFor,
  loopEntryElapsed,
} from "./how-it-works.line";

describe("heldProgress", () => {
  it("keeps the furthest progress when scrolling back up", () => {
    let held = -1;
    for (const raw of [0.1, 0.5, 0.8, 0.4, 0.1]) {
      held = heldProgress(held, raw, false);
    }
    expect(held).toBe(0.8);
  });

  it("resets once the row has dropped below the viewport", () => {
    expect(heldProgress(0.8, -0.6, true)).toBe(-0.6);
  });
});

describe("lineScrollProgress", () => {
  it("runs from 0 at the start line to 1 at the end line", () => {
    expect(lineScrollProgress(1000 * LINE_SCROLL.start, 1000)).toBeCloseTo(0);
    expect(lineScrollProgress(1000 * LINE_SCROLL.end, 1000)).toBeCloseTo(1);
  });

  it("goes below 0 before the row arrives and above 1 after it passes", () => {
    expect(lineScrollProgress(1000, 1000)).toBeLessThan(0);
    expect(lineScrollProgress(0, 1000)).toBeGreaterThan(1);
  });
});

describe("lineStateFor", () => {
  it("shows nothing before the row scrolls in", () => {
    expect(lineStateFor(-0.2, 4)).toEqual({
      progress: 0,
      opacity: 0,
      activeStep: 0,
      revealedSteps: 0,
    });
  });

  it("reveals the first step as soon as the line starts", () => {
    expect(lineStateFor(0, 4)).toMatchObject({ revealedSteps: 1, activeStep: 0 });
  });

  it("reveals each step as the line reaches it and activates it on arrival", () => {
    const halfway = lineStateFor(1 / 6, 4);
    expect(halfway).toMatchObject({
      progress: 1 / 6,
      opacity: 1,
      activeStep: 0,
      revealedSteps: 1,
    });

    const arriving = lineStateFor(1 / 3 - LINE_SCROLL.revealLead / 2, 4);
    expect(arriving).toMatchObject({ activeStep: 0, revealedSteps: 2 });

    const arrived = lineStateFor(1 / 3, 4);
    expect(arrived).toMatchObject({ activeStep: 1, revealedSteps: 2 });
  });

  it("is fully drawn with every step revealed past the end", () => {
    expect(lineStateFor(1.5, 4)).toEqual({
      progress: 1,
      opacity: 1,
      activeStep: 3,
      revealedSteps: 4,
    });
  });

  it("does nothing with fewer than two steps", () => {
    expect(lineStateFor(0.5, 1)).toEqual({
      progress: 0,
      opacity: 0,
      activeStep: 0,
      revealedSteps: 0,
    });
  });
});

describe("lineStateAt (loop once drawn)", () => {
  const { travel, dwell, finalHold, fadeOut } = LINE_TIMING;

  it("rests on the first step before setting off, with every step revealed", () => {
    expect(lineStateAt(0, 4)).toEqual({
      progress: 0,
      opacity: 1,
      activeStep: 0,
      revealedSteps: 4,
    });
  });

  it("glides between steps and only activates the next one on arrival", () => {
    const halfway = lineStateAt(dwell + travel / 2, 4);
    expect(halfway.progress).toBeCloseTo(1 / 6);
    expect(halfway.activeStep).toBe(0);

    const arrived = lineStateAt(dwell + travel, 4);
    expect(arrived.progress).toBeCloseTo(1 / 3);
    expect(arrived.activeStep).toBe(1);
  });

  it("holds on the last step, then fades out instead of snapping back", () => {
    const end = lineCycleDuration(4);
    expect(lineStateAt(end - fadeOut - 1, 4)).toMatchObject({
      progress: 1,
      opacity: 1,
      activeStep: 3,
    });
    expect(lineStateAt(end - fadeOut / 2, 4).opacity).toBeCloseTo(0.5);
    expect(lineStateAt(end - 1, 4).opacity).toBeLessThan(0.01);
  });

  it("loops back to the start", () => {
    expect(lineStateAt(lineCycleDuration(4), 4)).toEqual(lineStateAt(0, 4));
  });

  it("enters from a fully drawn line, matching where the scroll left it", () => {
    expect(lineStateAt(loopEntryElapsed(4), 4)).toEqual(lineStateFor(1, 4));
    expect(loopEntryElapsed(4)).toBe(lineCycleDuration(4) - finalHold - fadeOut);
  });
});
