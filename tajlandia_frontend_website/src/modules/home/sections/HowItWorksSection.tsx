'use client';

import { Container } from "@/components/ui/Container";
import { ScrollDirectionalReveal } from "@/components/animations/ScrollDirectionalReveal";
import { useInViewReplay } from "@/lib/hooks/useInViewReplay";
import { cn } from "@/lib/utils/cn";
import type { HomePageContent } from "../types/home.types";
import { useEffect, useRef, useState } from "react";
import {
  heldProgress,
  lineScrollProgress,
  lineStateAt,
  lineStateFor,
  loopEntryElapsed,
  type LineState,
} from "../components/how-it-works.line";

// The line and the scroll-driven step reveal only run where the steps share a row.
const LINE_LAYOUT_QUERY = "(min-width: 1024px)";

const stepIcons: Record<string, string> = {
  discover: "/images/home/how-it-works/discover.svg",
  explore: "/images/home/how-it-works/explore.svg",
  connect: "/images/home/how-it-works/claim.svg",
  secure: "/images/home/how-it-works/certificate.svg",
};

function StepIcon({ name }: { name: string }) {
  const src = stepIcons[name] ?? stepIcons.discover;

  return (
    <span
      aria-hidden="true"
      className="block h-[22px] w-[22px] bg-current"
      style={{
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskSize: "contain",
        maskSize: "contain",
      }}
    />
  );
}

type HowItWorksStepProps = {
  step: HomePageContent["howItWorks"]["steps"][number];
  index: number;
  label: string;
  active: boolean;
  /** Set on the desktop row, where the line reveals the step; otherwise the step reveals itself as it scrolls in. */
  lineRevealed?: boolean;
};

function HowItWorksStep({ step, index, label, active, lineRevealed }: HowItWorksStepProps) {
  const { ref, inView: selfInView } = useInViewReplay<HTMLLIElement>(0.3);
  const inView = lineRevealed ?? selfInView;

  return (
    <li ref={ref} className="relative z-10 min-w-0 text-center">
      <div className={cn("relative mx-auto inline-flex", inView ? "step-pop" : "opacity-0")}>
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0 rounded-full border-2 border-brand-red/60",
            inView ? "step-ripple" : "opacity-0",
          )}
        />
        <div
          className={`relative mx-auto flex h-14 w-14 items-center justify-center rounded-full ${
            active ? "bg-navy text-white" : "bg-white text-navy shadow-[inset_0_0_0_1.5px_#d9e1ec]"
          }`}
        >
          <StepIcon name={step.icon} />
        </div>
      </div>
      <div className={inView ? "step-rise" : "opacity-0"}>
        <p className="mt-4 text-[11px] font-semibold tracking-[0.14em] text-brand-red">
          {String(index + 1).padStart(2, "0")} {label}
        </p>
        <h3 className="mt-2 text-[16px] font-semibold leading-snug tracking-[-0.02em] text-navy">
          {step.title}
        </h3>
        <p className="mx-auto mt-2 max-w-[200px] text-[13px] leading-[1.45] text-[#8a99aa]">
          {step.description}
        </p>
      </div>
    </li>
  );
}

type HowItWorksSectionProps = {
  content: HomePageContent["howItWorks"];
};

export function HowItWorksSection({ content }: HowItWorksSectionProps) {
  const stepLabels = ["EXPLORE", "CHOOSE", "CLAIM", "CERTIFICATE"];
  const [activeStep, setActiveStep] = useState(0);
  // null until we know the layout; then whether the line drives the steps.
  const [lineDriven, setLineDriven] = useState<boolean | null>(null);
  const [revealedSteps, setRevealedSteps] = useState(0);
  const listRef = useRef<HTMLOListElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // Scroll drives the line first (see how-it-works.line.ts): down draws it and
  // pops each step in as the head reaches it; scrolling back up leaves it where
  // it got to. Once fully drawn it hands over to the looping timeline, which
  // runs only while the row is on screen. Progress and opacity go straight to
  // CSS variables; React only re-renders when the line reaches a new step.
  useEffect(() => {
    const track = trackRef.current;
    const list = listRef.current;
    const count = content.steps.length;
    const layout = window.matchMedia?.(LINE_LAYOUT_QUERY);
    if (!track || !list || count < 2 || !layout) {
      return;
    }
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let scrollRaf = 0;
    let loopRaf = 0;
    // performance.now() at the loop's (virtual) cycle start; 0 while scrolling.
    let loopStart = 0;
    let onScreen = false;
    let held = -1;

    const paint = (state: LineState) => {
      track.style.setProperty("--line-p", state.progress.toFixed(4));
      track.style.setProperty("--line-o", state.opacity.toFixed(3));
      setActiveStep(state.activeStep);
      setRevealedSteps(state.revealedSteps);
    };

    const loopTick = (now: number) => {
      loopRaf = 0;
      if (!loopStart || !onScreen) {
        return;
      }
      paint(lineStateAt(now - loopStart, count));
      loopRaf = requestAnimationFrame(loopTick);
    };
    const stopLoop = () => {
      loopStart = 0;
      cancelAnimationFrame(loopRaf);
      loopRaf = 0;
    };

    const update = () => {
      scrollRaf = 0;
      if (!layout.matches) {
        stopLoop();
        return;
      }
      const rect = list.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const below = rect.top >= viewportHeight;
      onScreen = rect.bottom > 0 && !below;
      held = heldProgress(held, lineScrollProgress(rect.top, viewportHeight), below);

      if (held < 1 || reducedMotion) {
        stopLoop();
        paint(lineStateFor(held, count));
        return;
      }
      // Fully drawn: start the loop from the full line (it fades, then replays).
      loopStart ||= performance.now() - loopEntryElapsed(count);
      if (onScreen && !loopRaf) {
        loopRaf = requestAnimationFrame(loopTick);
      }
    };
    const requestUpdate = () => {
      if (!scrollRaf) {
        scrollRaf = requestAnimationFrame(update);
      }
    };
    const syncLayout = () => {
      setLineDriven(layout.matches);
      requestUpdate();
    };

    syncLayout();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate, { passive: true });
    layout.addEventListener("change", syncLayout);

    return () => {
      cancelAnimationFrame(scrollRaf);
      cancelAnimationFrame(loopRaf);
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      layout.removeEventListener("change", syncLayout);
    };
  }, [content.steps.length]);

  if (content.steps.length === 0) {
    return null;
  }

  const worksAccent = "Works";
  const worksIndex = content.heading.lastIndexOf(worksAccent);
  const headingLead = worksIndex > 0 ? content.heading.slice(0, worksIndex).trimEnd() : content.heading;
  const headingAccent = worksIndex > 0 ? content.heading.slice(worksIndex) : "";

  return (
    <section id="how-it-works" className="bg-white pb-[60px] pt-1 lg:pb-[80px] lg:pt-2">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <ScrollDirectionalReveal reverseDelay={150}>
            <h2 className="font-[family-name:var(--font-playfair-display)] text-[40px] font-semibold leading-[1.05] tracking-[-0.03em] text-navy sm:text-[48px]">
              {headingLead}
              {headingAccent ? (
                <>
                  {" "}
                  <span className="italic text-brand-red">{headingAccent}</span>
                </>
              ) : null}
            </h2>
          </ScrollDirectionalReveal>
          <ScrollDirectionalReveal delay={150} reverseDelay={0}>
            <p className="mx-auto mt-3 max-w-[34rem] font-[family-name:var(--font-manrope)] text-[16px] font-normal leading-[1.5] text-[#8a99aa] sm:text-[17px]">
              A seamless process to acquire and showcase
              <br />
              your digital collectible.
            </p>
          </ScrollDirectionalReveal>
        </div>

        <ol
          ref={listRef}
          className="relative mt-12 grid list-none gap-10 p-0 sm:grid-cols-2 lg:mt-14 lg:grid-cols-4 lg:gap-8"
        >
          <div
            ref={trackRef}
            className="pointer-events-none absolute left-[12.5%] right-[12.5%] top-7 hidden h-[3px] -translate-y-1/2 overflow-visible rounded-full bg-[#f3d6d6] [--line-o:0] [--line-p:0] lg:block"
            aria-hidden="true"
          >
            {/* Drawn line: scaled, not resized, so it stays on the compositor. */}
            <div className="absolute inset-0 origin-left scale-x-(--line-p) rounded-full bg-brand-red opacity-(--line-o) shadow-[0_0_12px_rgba(200,30,30,0.55)]" />
            {/* Shine trailing the head. */}
            <span className="absolute inset-y-[-1px] left-[calc(var(--line-p)*100%)] w-10 -translate-x-full rounded-full bg-gradient-to-r from-transparent via-white/70 to-white opacity-[calc(var(--line-o)*min(var(--line-p)*20,1))]" />
            {/* Glowing head. */}
            <span className="absolute left-[calc(var(--line-p)*100%)] top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-(--line-o) shadow-[0_0_0_3px_#c81e1e,0_0_14px_4px_rgba(200,30,30,0.65)]" />
          </div>
          {content.steps.map((step, index) => (
            <HowItWorksStep
              key={step.id}
              step={step}
              index={index}
              label={stepLabels[index] ?? step.id.toUpperCase()}
              active={activeStep === index}
              lineRevealed={lineDriven ? index < revealedSteps : undefined}
            />
          ))}
        </ol>
      </Container>
    </section>
  );
}
