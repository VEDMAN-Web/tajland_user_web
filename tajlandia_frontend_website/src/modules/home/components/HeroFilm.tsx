"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils/cn";
import type { HomeHeroFilm } from "../types/home.types";
import {
  blockMotion,
  clamp,
  frameLoadOrder,
  frameUrl,
  introMotion,
  motionToStyle,
  scrollProgress,
} from "./hero-film.motion";

type HeroFilmProps = {
  film: HomeHeroFilm;
  /** Server-rendered fallback (first frame) shown until the canvas paints. */
  poster: React.ReactNode;
  /** Optional sharp still faded in over the last frames (`.hero-film-finale`). */
  finale?: React.ReactNode;
  /** Overlay layers. Animated through data attributes, see below. */
  children: React.ReactNode;
  className?: string;
};

// Fraction of the remaining scroll distance covered per 60fps frame. Gives
// the film a "scrubbed" glide instead of snapping to the scroll position.
const SCROLL_EASE = 0.1;
const FRAME_MS = 1000 / 60;
const SETTLE_EPSILON = 0.0002;
const LOAD_CONCURRENCY = 6;
const LINE_STAGGER = 0.012;

type FrameStore = (HTMLImageElement | null)[];

// Last style written per overlay element, so unchanged layers (e.g. blocks
// still waiting off stage) are not restyled every frame.
const appliedStyles = new WeakMap<HTMLElement, string>();

function applyStyle(element: HTMLElement, style: ReturnType<typeof motionToStyle>) {
  const key = `${style.opacity}|${style.transform}|${style.filter}|${style.visibility}`;
  if (appliedStyles.get(element) === key) {
    return;
  }
  appliedStyles.set(element, key);
  element.style.opacity = style.opacity;
  element.style.transform = style.transform;
  element.style.filter = style.filter;
  element.style.visibility = style.visibility;
}

function nearestLoaded(frames: FrameStore, index: number) {
  if (frames[index]) {
    return frames[index];
  }
  for (let offset = 1; offset < frames.length; offset += 1) {
    const before = frames[index - offset];
    if (before) return before;
    const after = frames[index + offset];
    if (after) return after;
  }
  return null;
}

/**
 * Scroll-driven image-sequence hero ("scroll film").
 *
 * The section is several viewports tall; a sticky stage holds a canvas that
 * draws the frame matching the scroll position, plus overlay layers that the
 * scroll choreographs. Overlay hooks:
 *  - `data-film-intro`: visible at the top, animates out early.
 *  - `data-film-block` + `data-from` / `data-to` (+ `data-hold`): story block,
 *    its `data-film-line` children rise in one after another. The block also
 *    gets `--block-visible` (0..1) for its scrim.
 *  - `data-film-hint`: fades out as soon as scrolling starts.
 *  - `data-film-chapter` + `data-from` / `data-to`: gets `data-active="true"`.
 * `--film-progress` (0..1) is also exposed on the root for CSS-only effects.
 */
export function HeroFilm({ film, poster, finale, children, className }: HeroFilmProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!root || !stage || !canvas || typeof window.matchMedia !== "function") {
      return;
    }
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) {
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData =
      (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData ===
      true;
    // Phones (portrait or landscape) and data-saver get the lighter frame set.
    const compact =
      saveData || window.matchMedia("(max-width: 767px), (max-height: 500px)").matches;
    const frameSet = compact ? film.mobile : film.desktop;
    // Reduced motion: keep the story, drop the moving footage.
    const frameCount = reducedMotion ? 1 : frameSet.frameCount;

    const intro = root.querySelector<HTMLElement>("[data-film-intro]");
    const hint = root.querySelector<HTMLElement>("[data-film-hint]");
    const blocks = Array.from(root.querySelectorAll<HTMLElement>("[data-film-block]")).map(
      (element) => ({
        element,
        from: Number(element.dataset.from),
        to: Number(element.dataset.to),
        hold: element.dataset.hold === "true",
        lines: Array.from(element.querySelectorAll<HTMLElement>("[data-film-line]")),
      }),
    );
    const chapters = Array.from(root.querySelectorAll<HTMLElement>("[data-film-chapter]")).map(
      (element) => ({
        element,
        from: Number(element.dataset.from),
        to: Number(element.dataset.to),
      }),
    );

    const frames: FrameStore = new Array(frameCount).fill(null);
    let disposed = false;
    let rafId = 0;
    let lastTime = 0;
    let target = 0;
    let current = 0;
    let drawnKey = "";
    let painted = false;
    let stickyTop = 0;
    let overlaysAt = -1;
    // Natural size of the frames, known once the first one has loaded.
    let sourceWidth = 0;
    let sourceHeight = 0;

    // ---- Canvas sizing -------------------------------------------------
    const resize = () => {
      stickyTop = parseFloat(getComputedStyle(stage).top) || 0;
      const ratio = Math.min(window.devicePixelRatio || 1, compact ? 1.5 : 2);
      let width = stage.clientWidth * ratio;
      let height = stage.clientHeight * ratio;
      // Never hold more pixels than the frames have: past that the canvas only
      // upscales them, which the browser does just as well when it scales the
      // canvas to the stage, at a fraction of the drawing cost.
      const cover = sourceWidth ? Math.max(width / sourceWidth, height / sourceHeight) : 1;
      if (cover > 1) {
        width /= cover;
        height /= cover;
      }
      width = Math.round(width);
      height = Math.round(height);
      if (width && height && (canvas.width !== width || canvas.height !== height)) {
        canvas.width = width;
        canvas.height = height;
        drawnKey = "";
      }
    };

    const drawCover = (image: HTMLImageElement, alpha: number) => {
      const scale = Math.max(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
      const width = image.naturalWidth * scale;
      const height = image.naturalHeight * scale;
      context.globalAlpha = alpha;
      context.drawImage(image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
    };

    // ---- Frame drawing -------------------------------------------------
    const draw = (progress: number) => {
      const position = progress * (frameCount - 1);
      const index = Math.floor(position);
      const mix = position - index;
      const base = nearestLoaded(frames, index);
      if (!base) {
        return;
      }
      const next = mix > 0.02 ? frames[index + 1] : null;
      const key = `${base.src}|${next ? next.src : ""}|${mix.toFixed(2)}|${canvas.width}`;
      if (key === drawnKey) {
        return;
      }
      drawnKey = key;
      drawCover(base, 1);
      // Cross-fade into the next frame so slow scrolling stays fluid.
      if (next) {
        drawCover(next, mix);
      }
      context.globalAlpha = 1;
      if (!painted) {
        painted = true;
        root.dataset.filmReady = "true";
      }
    };

    // ---- Overlay choreography -----------------------------------------
    const animateOverlays = (progress: number) => {
      root.style.setProperty("--film-progress", progress.toFixed(4));

      if (intro) {
        const motion = introMotion(progress);
        applyStyle(intro, motionToStyle(reducedMotion ? { ...motion, y: 0, scale: 1, blur: 0 } : motion));
      }
      if (hint) {
        hint.style.opacity = (1 - clamp(progress / 0.04)).toFixed(3);
      }
      for (const block of blocks) {
        // Drives the block's own scrim (`--block-visible`, 0..1) in CSS.
        const visible = blockMotion(progress, block.from, block.to, { holdEnd: block.hold }).opacity;
        block.element.style.setProperty("--block-visible", visible.toFixed(3));
        block.lines.forEach((line, index) => {
          const motion = blockMotion(progress, block.from, block.to, {
            lineDelay: index * LINE_STAGGER,
            holdEnd: block.hold,
          });
          applyStyle(line, motionToStyle(reducedMotion ? { ...motion, y: 0, blur: 0 } : motion));
        });
      }
      for (const chapter of chapters) {
        // The last chapter stays active through the very end of the film.
        const active = progress >= chapter.from && (progress < chapter.to || chapter.to >= 1);
        chapter.element.dataset.active = String(active);
      }
    };

    // ---- Animation loop (runs only while the scroll is settling) -------
    const readTarget = () => {
      const rect = root.getBoundingClientRect();
      target = scrollProgress(rect.top, rect.height, stage.clientHeight, stickyTop);
      // Lets page chrome react to the film (e.g. the site header in globals.css).
      const state = target >= 0.999 ? "done" : "playing";
      if (document.documentElement.dataset.heroFilm !== state) {
        document.documentElement.dataset.heroFilm = state;
      }
    };

    const tick = (time: number) => {
      // Measured here rather than in the scroll handler: once per frame, and
      // before this frame writes any styles, so it never forces a layout.
      readTarget();
      const dt = lastTime ? Math.min(time - lastTime, 64) : FRAME_MS;
      lastTime = time;
      const ease = reducedMotion ? 1 : 1 - Math.pow(1 - SCROLL_EASE, dt / FRAME_MS);
      current += (target - current) * ease;

      const settled = Math.abs(target - current) < SETTLE_EPSILON;
      if (settled) {
        current = target;
      }
      draw(current);
      // Scrolling the rest of the page leaves the film at rest: skip the overlays.
      if (current !== overlaysAt) {
        overlaysAt = current;
        animateOverlays(current);
      }

      if (settled) {
        rafId = 0;
        lastTime = 0;
        return;
      }
      rafId = requestAnimationFrame(tick);
    };

    const requestTick = () => {
      if (!rafId && !disposed) {
        rafId = requestAnimationFrame(tick);
      }
    };

    const onScroll = () => {
      requestTick();
    };

    const onResize = () => {
      resize();
      requestTick();
    };

    // ---- Frame loading (coarse-to-fine, limited concurrency) -----------
    const loadFrame = (index: number) =>
      new Promise<void>((resolve) => {
        const image = new Image();
        image.decoding = "async";
        image.src = frameUrl(frameSet.framePath, index);
        const done = () => {
          if (!disposed && image.naturalWidth) {
            if (!sourceWidth) {
              sourceWidth = image.naturalWidth;
              sourceHeight = image.naturalHeight;
              resize();
            }
            frames[index] = image;
            drawnKey = "";
            requestTick();
          }
          resolve();
        };
        image
          .decode()
          .then(done)
          .catch(() => resolve());
      });

    // Frame 0 is loaded first on its own; the rest stream in afterwards.
    const queue = frameLoadOrder(frameCount).filter((index) => index !== 0);
    const worker = async () => {
      while (!disposed && queue.length) {
        const index = queue.shift();
        if (index !== undefined) {
          await loadFrame(index);
        }
      }
    };

    resize();
    readTarget();
    current = target;
    overlaysAt = current;
    animateOverlays(current);

    // First frame alone, then stream the rest so it never competes with LCP.
    let idleHandle = 0;
    void loadFrame(0).then(() => {
      if (disposed) return;
      idleHandle = window.setTimeout(() => {
        for (let slot = 0; slot < LOAD_CONCURRENCY; slot += 1) {
          void worker();
        }
      }, 300);
    });

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      window.clearTimeout(idleHandle);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      delete document.documentElement.dataset.heroFilm;
    };
  }, [film]);

  return (
    <div ref={rootRef} className={cn("hero-film relative", className)}>
      <div
        ref={stageRef}
        // Below lg the stage sits under the sticky header; from lg the header
        // floats over the film (globals.css), so the stage fills the viewport.
        className="sticky top-[4.5rem] h-[calc(100svh-4.5rem)] w-full overflow-hidden bg-navy-deep sm:top-20 sm:h-[calc(100svh-5rem)] lg:top-0 lg:h-svh"
      >
        <div className="hero-film-media absolute inset-0">
          {poster}
          <canvas ref={canvasRef} className="hero-film-canvas absolute inset-0 h-full w-full" aria-hidden="true" />
          {finale ? <div className="hero-film-finale">{finale}</div> : null}
        </div>
        {children}
      </div>
    </div>
  );
}
