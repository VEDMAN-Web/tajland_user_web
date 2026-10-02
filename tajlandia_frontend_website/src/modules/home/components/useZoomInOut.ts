"use client";

import { useEffect, useRef } from "react";
import { zoomMotion, zoomProgress, zoomTransform } from "./zoom-in-out.motion";

// Fraction of the remaining distance covered per 60fps frame (same glide as the hero film).
const SCROLL_EASE = 0.12;
const FRAME_MS = 1000 / 60;
const SETTLE_EPSILON = 0.0005;

/**
 * Scroll-linked "zoom in / zoom out": the element grows into place as it scrolls
 * into view and shrinks slightly as it leaves the top (reverses when scrolling
 * back). Writes styles straight to the element, so it never re-renders.
 */
export function useZoomInOut<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof window.matchMedia !== "function") {
      return;
    }
    let rafId = 0;
    let lastTime = 0;
    let target = 0;
    let current = 0;

    // The transform moves the element itself, so measure its (untransformed) parent.
    const anchor = element.parentElement ?? element;
    const readTarget = () => {
      const rect = anchor.getBoundingClientRect();
      target = zoomProgress(rect.top, rect.height, window.innerHeight);
    };

    const apply = (progress: number) => {
      const motion = zoomMotion(progress);
      element.style.transform = zoomTransform(motion);
      element.style.opacity = motion.opacity.toFixed(3);
    };

    const tick = (time: number) => {
      const dt = lastTime ? Math.min(time - lastTime, 64) : FRAME_MS;
      lastTime = time;
      current += (target - current) * (1 - Math.pow(1 - SCROLL_EASE, dt / FRAME_MS));
      const settled = Math.abs(target - current) < SETTLE_EPSILON;
      if (settled) {
        current = target;
      }
      apply(current);
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

    // Reduced motion: no scroll-linked movement, leave the element as authored.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    readTarget();
    current = target;
    apply(current);

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      element.style.transform = "";
      element.style.opacity = "";
    };
  }, []);

  return ref;
}
