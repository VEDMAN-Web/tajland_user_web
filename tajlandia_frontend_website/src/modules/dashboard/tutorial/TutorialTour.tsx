"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useMinimumRai } from "@/lib/cart/cart-snapshot";
import { fill } from "../CartSummaryCard";
import { useDashboardLanguage } from "../DashboardLanguageContext";
import {
  getTutorialSnapshot,
  parseTutorialProgress,
  setTutorialStep,
  stopTutorial,
  subscribeTutorial,
} from "./tutorial-store";
import { getTutorial } from "./tutorials";

type Box = { left: number; top: number; width: number; height: number };
type Tip = { left: number; top: number; compact: boolean };
type Layout = {
  box: Box | null;
  tip: Tip | null;
  /** True just after the tour moves to a new element: the light and tooltip glide there. */
  glide: boolean;
  /** Nothing to light up for a while: show the small bar instead. */
  waiting: boolean;
};

const EMPTY_LAYOUT: Layout = { box: null, tip: null, glide: false, waiting: false };

// Room around the lit element, and between it and the tooltip.
const PAD = 8;
const GAP = 14;
const EDGE = 12;
const TIP_WIDTH = 320;
// The element can vanish for a moment (the page re-renders, a panel swaps): the light stays
// put this long instead of flashing off, and the "waiting" bar only shows after a longer gap.
const HOLD_MS = 350;
const WAITING_MS = 700;
// How long the light and tooltip glide to a new element. Outside it they follow the page
// without easing (scrolling), so they never lag behind what they point at.
const GLIDE_MS = 450;

/** The first visible element for the names; later names are helpers (e.g. the phone's menu button). */
function findTarget(names: string[]): { el: HTMLElement; helper: boolean } | null {
  for (const [index, name] of names.entries()) {
    const el = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`)).find((candidate) => {
      // Not the closed drawer (inert) or something off to the side.
      if (candidate.closest("[inert]")) return false;
      const rect = candidate.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && rect.right > 0 && rect.left < window.innerWidth;
    });
    if (el) return { el, helper: index > 0 };
  }
  return null;
}

/**
 * Below the lit element if it fits, else above, to the right, to the left, else along the
 * bottom. With `beside`, only the sides (something opens under the element, so below / above
 * would cover it); with no room there (a phone) it drops to the bottom of the screen in a
 * short form (no description).
 */
function placeTip(box: Box, tip: { width: number; height: number }, beside = false): Tip {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const left = box.left - PAD;
  const top = box.top - PAD;
  const right = box.left + box.width + PAD;
  const bottom = box.top + box.height + PAD;
  const clampX = (x: number) => Math.min(Math.max(x, EDGE), Math.max(EDGE, vw - tip.width - EDGE));
  const clampY = (y: number) => Math.min(Math.max(y, EDGE), Math.max(EDGE, vh - tip.height - EDGE));
  const centreX = clampX((left + right) / 2 - tip.width / 2);
  const centreY = clampY((top + bottom) / 2 - tip.height / 2);
  const sideTop = beside ? clampY(top) : centreY;
  const below = { left: centreX, top: bottom + GAP, fits: bottom + GAP + tip.height <= vh - EDGE };
  const above = { left: centreX, top: top - GAP - tip.height, fits: top - GAP - tip.height >= EDGE };
  const toRight = { left: right + GAP, top: sideTop, fits: right + GAP + tip.width <= vw - EDGE };
  const toLeft = { left: left - GAP - tip.width, top: sideTop, fits: left - GAP - tip.width >= EDGE };
  const options = beside ? [toRight, toLeft] : [below, above, toRight, toLeft];
  const fit = options.find((option) => option.fits);
  if (fit) return { left: fit.left, top: fit.top, compact: false };
  return { left: centreX, top: clampY(vh - tip.height - EDGE), compact: beside };
}

/** Moves a tutorial on from step `index` (only if it is still on that step), or ends it. */
function advanceFrom(id: string, index: number, total: number) {
  const current = parseTutorialProgress(getTutorialSnapshot());
  if (!current || current.id !== id || current.step !== index) return;
  if (index + 1 >= total) stopTutorial();
  else setTutorialStep(id, index + 1);
}

const sameBox = (a: Box | null, b: Box | null) =>
  a === b ||
  (a !== null &&
    b !== null &&
    Math.abs(a.left - b.left) < 0.5 &&
    Math.abs(a.top - b.top) < 0.5 &&
    Math.abs(a.width - b.width) < 0.5 &&
    Math.abs(a.height - b.height) < 0.5);

const sameLayout = (a: Layout, b: Layout) =>
  sameBox(a.box, b.box) &&
  a.glide === b.glide &&
  a.waiting === b.waiting &&
  a.tip?.left === b.tip?.left &&
  a.tip?.top === b.tip?.top &&
  a.tip?.compact === b.tip?.compact;

/**
 * The guided tutorial: dims the page, lights up the element a step points at and shows a
 * tooltip beside it. Click steps wait for the user to really click that element; the tour
 * follows them across pages (its place is kept for the tab).
 */
export function TutorialTour() {
  const { t } = useDashboardLanguage();
  const minimumRai = useMinimumRai();
  // Steps can mention the minimum as {min}; it comes from the cart, not from the text.
  const tf = (text: string) => fill(t(text), { min: minimumRai });
  const raw = useSyncExternalStore(subscribeTutorial, getTutorialSnapshot, () => null);
  const progress = parseTutorialProgress(raw);
  const tutorial = progress ? getTutorial(progress.id) : undefined;
  const stepIndex = progress?.step ?? 0;
  const step = tutorial?.steps[stepIndex];
  const total = tutorial?.steps.length ?? 0;
  const tutorialId = tutorial?.id;

  const [layout, setLayout] = useState<Layout>(EMPTY_LAYOUT);
  // What the tour last drew, kept so the next step glides from there.
  const layoutRef = useRef<Layout>(EMPTY_LAYOUT);
  // The element a click on must move the tour on (not a helper such as the menu button).
  const targetRef = useRef<HTMLElement | null>(null);
  // Shown instead while the target isn't visible (the phone's menu button).
  const helperRef = useRef<HTMLElement | null>(null);
  const tipRef = useRef<HTMLDivElement>(null);

  // A saved tutorial or step that no longer exists (renamed, shortened): drop it.
  useEffect(() => {
    if (raw && (!tutorial || !step)) stopTutorial();
  }, [raw, tutorial, step]);

  // Follows the page every frame: finds the element, keeps the light and tooltip on it,
  // skips steps already done, and moves on by itself for "when" steps.
  useEffect(() => {
    if (!tutorialId || !step) return;
    let frame = 0;
    let scrolledTo: Element | null = null;
    let lastEl: Element | null = null;
    let glide = false;
    let glideTimer = 0;
    let lastSeen = performance.now();
    let current: Layout = { ...layoutRef.current, waiting: false };

    const publish = (next: Layout) => {
      if (sameLayout(current, next)) return;
      current = next;
      layoutRef.current = next;
      setLayout(next);
    };

    const tick = () => {
      const names = Array.isArray(step.target) ? step.target : [step.target];
      const onPage = !step.path || window.location.pathname.startsWith(step.path);
      let found: { el: HTMLElement; helper: boolean } | null = null;
      if (onPage) {
        if (step.skipIf?.() || (typeof step.advance === "object" && step.advance.when())) {
          advanceFrom(tutorialId, stepIndex, total);
          return;
        }
        found = findTarget(names);
      }
      targetRef.current = found && !found.helper ? found.el : null;
      helperRef.current = found?.helper ? found.el : null;

      const now = performance.now();
      if (found) {
        lastSeen = now;
        // A new element: glide to it (then stop easing, so scrolling is followed exactly).
        if (found.el !== lastEl) {
          lastEl = found.el;
          glide = true;
          window.clearTimeout(glideTimer);
          glideTimer = window.setTimeout(() => {
            glide = false;
            publish({ ...current, glide: false });
          }, GLIDE_MS);
        }
        const rect = found.el.getBoundingClientRect();
        const box: Box = { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
        // Bring it into view once (e.g. a plot lower in the list, the button at the bottom).
        if (scrolledTo !== found.el && (rect.top < 0 || rect.bottom > window.innerHeight)) {
          scrolledTo = found.el;
          found.el.scrollIntoView({ block: "center", behavior: "smooth" });
        }
        const tipRect = tipRef.current?.getBoundingClientRect();
        const tip = tipRect
          ? placeTip(box, { width: tipRect.width, height: tipRect.height }, step.tipBeside)
          : current.tip;
        publish({ box, tip, glide, waiting: false });
      } else if (now - lastSeen < HOLD_MS) {
        // Gone for a moment: keep what is drawn instead of flashing it off.
        publish({ ...current, waiting: false });
      } else {
        publish({ box: null, tip: null, glide: false, waiting: now - lastSeen > WAITING_MS });
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(glideTimer);
    };
  }, [tutorialId, step, stepIndex, total]);

  // A real click on the lit element moves a "click" step on, once the page has reacted.
  useEffect(() => {
    if (!tutorialId || step?.advance !== "click") return;
    function handleClick(event: MouseEvent) {
      const target = targetRef.current;
      if (target && event.target instanceof Node && target.contains(event.target)) {
        window.setTimeout(() => advanceFrom(tutorialId as string, stepIndex, total), 250);
      }
    }
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [tutorialId, step, stepIndex, total]);

  useEffect(() => {
    if (!tutorialId) return;
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") stopTutorial();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [tutorialId]);

  if (!tutorial || !step) return null;

  function goNext() {
    if (!tutorialId) return;
    const target = targetRef.current;
    const helper = helperRef.current;
    if (step?.advance === "click" && target) {
      // A real click: the page reacts as if the user did it, and the click listener moves on.
      target.click();
    } else if (step?.advance === "click" && helper) {
      helper.click();
    } else {
      advanceFrom(tutorialId, stepIndex, total);
    }
  }

  const { box, tip, glide, waiting } = layout;
  const hole = box
    ? { left: box.left - PAD, top: box.top - PAD, width: box.width + PAD * 2, height: box.height + PAD * 2 }
    : null;
  const stepLabel = `${t("Step")} ${stepIndex + 1} / ${total}`;
  const last = stepIndex === total - 1;
  const hint =
    step.advance === "click"
      ? t("Click the highlighted part to continue")
      : step.advance === "next"
        ? null
        : t("Do this on the screen to continue");
  // Gliding to a new element eases; otherwise the light and tooltip follow the page with no delay.
  const spotlightTransition = glide
    ? "transition-[left,top,width,height] duration-300 ease-out motion-reduce:transition-none"
    : "transition-none";
  const tipTransition = glide
    ? "transition-[left,top,opacity] duration-300 ease-out motion-reduce:transition-none"
    : "transition-opacity duration-200 motion-reduce:transition-none";

  return (
    <>
      {hole ? (
        <>
          {/* Blocks every click except on the lit element (a clip-path hole lets those through). */}
          {step.free ? null : (
            <div
              aria-hidden="true"
              className="fixed inset-0 z-100"
              style={{
                clipPath: `polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${hole.left}px ${hole.top}px, ${hole.left}px ${hole.top + hole.height}px, ${hole.left + hole.width}px ${hole.top + hole.height}px, ${hole.left + hole.width}px ${hole.top}px, ${hole.left}px ${hole.top}px)`,
              }}
            />
          )}
          {/* The light: a hole in a big shadow. It fades in once and glides from one element
              to the next, but follows the page exactly while the user scrolls. */}
          <div
            aria-hidden="true"
            className={`pointer-events-none fixed z-100 rounded-[14px] motion-safe:animate-[fade-in_0.3s_ease-out] ${spotlightTransition}`}
            style={{
              left: hole.left,
              top: hole.top,
              width: hole.width,
              height: hole.height,
              boxShadow: `0 0 0 9999px rgba(11, 31, 77, ${step.free ? 0.3 : 0.62})`,
            }}
          >
            <span className="absolute inset-0 rounded-[inherit] border-2 border-white/90 motion-safe:animate-pulse" />
          </div>
          <div
            ref={tipRef}
            role="dialog"
            aria-label={tf(step.title)}
            className={`fixed z-101 rounded-[16px] bg-white p-4 font-manrope shadow-[0_18px_44px_rgba(11,31,77,0.35)] ${tipTransition} ${tip ? "opacity-100" : "pointer-events-none opacity-0"}`}
            style={{
              left: tip?.left ?? hole.left,
              top: tip?.top ?? hole.top + hole.height + GAP,
              width: `min(${TIP_WIDTH}px, calc(100vw - ${EDGE * 2}px))`,
            }}
          >
            <div key={stepIndex} className="motion-safe:animate-[fade-in_0.25s_ease-out]">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-red">{stepLabel}</p>
                <button
                  type="button"
                  onClick={stopTutorial}
                  className="cursor-pointer text-[12px] font-medium text-[#8b939e] hover:text-navy"
                >
                  {t("Skip tutorial")}
                </button>
              </div>
              <h2 className="mt-2 text-[16px] font-semibold leading-snug text-[#1a1a1a]">{tf(step.title)}</h2>
              {tip?.compact ? null : <p className="mt-1 text-[13px] leading-5 text-[#6b7785]">{tf(step.body)}</p>}
              {hint ? (
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="flex min-w-0 items-center gap-2 text-[12px] font-medium text-navy">
                    <span className="inline-flex h-2 w-2 shrink-0 rounded-full bg-brand-red motion-safe:animate-pulse" />
                    {hint}
                  </p>
                  {/* Next does the step for the user (presses the lit button), so the tour can be
                      followed without clicking; a helper (the phone's menu button) is pressed
                      instead and the step stays. A "manual" step has no Next: the user presses it. */}
                  {step.manual ? null : (
                    <button
                      type="button"
                      onClick={goNext}
                      className="shrink-0 cursor-pointer rounded-full bg-navy px-4 py-1.5 text-[12px] font-medium text-white hover:bg-navy-deep"
                    >
                      {t(last ? "Finish" : "Next")}
                    </button>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => tutorialId && advanceFrom(tutorialId, stepIndex, total)}
                  className="mt-3 h-10 w-full cursor-pointer rounded-full bg-navy px-5 text-[13px] font-medium text-white hover:bg-navy-deep"
                >
                  {t(last ? "Finish" : "Next")}
                </button>
              )}
            </div>
          </div>
        </>
      ) : waiting ? (
        // Nothing to light up for a while (the page is slow, or e.g. no plot for sale in that
        // region): a small bar, nothing dimmed, so the user is never stuck.
        <div className="fixed bottom-4 left-1/2 z-101 flex -translate-x-1/2 items-center gap-3 rounded-full bg-navy px-4 py-2 font-manrope text-[12px] font-medium text-white shadow-[0_10px_28px_rgba(11,31,77,0.35)] motion-safe:animate-[fade-in_0.3s_ease-out]">
          <span>{`${t("Tutorial")} · ${stepLabel}`}</span>
          <button
            type="button"
            onClick={() => tutorialId && advanceFrom(tutorialId, stepIndex, total)}
            className="cursor-pointer rounded-full bg-white px-3 py-1 text-navy hover:bg-[#eef2f9]"
          >
            {t(last ? "Finish" : "Next")}
          </button>
          <button type="button" onClick={stopTutorial} className="cursor-pointer text-white/80 underline underline-offset-2 hover:text-white">
            {t("Skip tutorial")}
          </button>
        </div>
      ) : null}
    </>
  );
}
