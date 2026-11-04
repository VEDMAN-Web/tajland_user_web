"use client";

import { useEffect, useRef, useState } from "react";
import {
  tiltUpExitProgress,
  tiltUpMotion,
  tiltUpProgress,
  tiltUpTransform,
} from "./tilt-up.motion";

// Fraction of the remaining distance covered per 60fps frame (same glide as the hero film).
const SCROLL_EASE = 0.12;
const FRAME_MS = 1000 / 60;
const SETTLE_EPSILON = 0.0005;
// Hysteresis so `upright` doesn't flicker around a single threshold.
const UPRIGHT_AT = 0.97;
const RESET_BELOW = 0.3;

/**
 * Scroll-linked "screen tilt-up": the element starts lying back off to the
 * right and stands up as it scrolls into view, then slides out to the left as
 * it leaves the top (all of it reverses when scrolling back). Writes the transform
 * straight to the element; React only re-renders when `upright` flips.
 */
export function useTiltUp<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [upright, setUpright] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof window.matchMedia !== "function") {
      return;
    }
    let rafId = 0;
    let lastTime = 0;
    let target = 0;
    let current = 0;
    let exitTarget = 0;
    let exitCurrent = 0;
    let isUpright = false;

    // The transform moves the element itself, so measure its (untransformed) parent.
    const anchor = element.parentElement ?? element;
    const readTarget = () => {
      const rect = anchor.getBoundingClientRect();
      target = tiltUpProgress(rect.top, window.innerHeight);
      exitTarget = tiltUpExitProgress(rect.bottom, window.innerHeight);
    };

    const apply = (progress: number, exit: number) => {
      element.style.transform = tiltUpTransform(tiltUpMotion(progress, exit));
      const next = isUpright ? progress > RESET_BELOW : progress >= UPRIGHT_AT;
      if (next !== isUpright) {
        isUpright = next;
        setUpright(next);
      }
    };

    const tick = (time: number) => {
      const dt = lastTime ? Math.min(time - lastTime, 64) : FRAME_MS;
      lastTime = time;
      const ease = 1 - Math.pow(1 - SCROLL_EASE, dt / FRAME_MS);
      current += (target - current) * ease;
      exitCurrent += (exitTarget - exitCurrent) * ease;
      const settled =
        Math.abs(target - current) < SETTLE_EPSILON &&
        Math.abs(exitTarget - exitCurrent) < SETTLE_EPSILON;
      if (settled) {
        current = target;
        exitCurrent = exitTarget;
      }
      apply(current, exitCurrent);
      if (settled) {
        rafId = 0;
        lastTime = 0;
        return;
      }
      rafId = requestAnimationFrame(tick);
    };

    const onScroll = () => {
      readTarget();
      if (!rafId) {
        rafId = requestAnimationFrame(tick);
      }
    };

    // Reduced motion: stay upright, no scroll-linked movement.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      apply(1, 0);
      return () => {
        element.style.transform = "";
      };
    }

    readTarget();
    current = target;
    exitCurrent = exitTarget;
    apply(current, exitCurrent);

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      element.style.transform = "";
    };
  }, []);

  return { ref, upright };
}
