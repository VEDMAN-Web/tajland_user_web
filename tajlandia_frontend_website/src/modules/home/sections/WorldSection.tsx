"use client";

import { useEffect, useRef, useState } from "react";
import { Container } from "@/components/ui/Container";
import { AnimatedVideoCard } from "@/components/cards/AnimatedVideoCard";
import { useTiltUp } from "../components/useTiltUp";
import type { HomePageContent } from "../types/home.types";

type WorldSectionProps = {
  content: HomePageContent["world"];
};

const TYPE_INTERVAL_MS = 70;

/**
 * Types `text` out once `active` turns on. The caller remounts it (via `key`)
 * when `active` changes, so turning it off starts the next run from empty.
 */
function TypedUrl({ text, active }: { text: string; active: boolean }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!active) {
      return;
    }
    const instant = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const id = window.setInterval(
      () => {
        setCount((current) => {
          const next = instant ? text.length : current + 1;
          if (next >= text.length) {
            window.clearInterval(id);
          }
          return Math.min(next, text.length);
        });
      },
      instant ? 0 : TYPE_INTERVAL_MS,
    );
    return () => window.clearInterval(id);
  }, [active, text]);

  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {text.slice(0, count)}
        <span className="url-caret ml-px inline-block h-[1em] w-px translate-y-[0.15em] bg-white/70" />
      </span>
    </>
  );
}

export function WorldSection({ content }: WorldSectionProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  // Scroll tilt lives on an outer wrapper; the mouse tilt in AnimatedVideoCard
  // writes its own transform to `frameRef`, so the two never overwrite each other.
  const { ref: tiltRef, upright } = useTiltUp<HTMLDivElement>();
  const poster = content.video?.poster ?? content.image;

  if (!content.video && !content.image) {
    return null;
  }

  return (
    <section className="overflow-x-clip bg-white pb-[60px]" aria-label={content.alt}>
      <Container>
        <div ref={tiltRef} className="origin-bottom will-change-transform">
          <div ref={frameRef} className="[perspective:1200px] will-change-transform">
            <div className="overflow-hidden rounded-[1.75rem] bg-white shadow-[0_18px_45px_rgba(11,31,77,0.14)] ring-1 ring-black/5">
              <div className="relative flex h-9 items-center gap-3 overflow-hidden bg-[#17181c] px-4 sm:px-5">
                <div className="flex shrink-0 items-center gap-1.5" aria-hidden="true">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57] sm:h-3 sm:w-3" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e] sm:h-3 sm:w-3" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#28c840] sm:h-3 sm:w-3" />
                </div>
                <div className="pointer-events-none absolute inset-x-0 flex justify-center px-16">
                  <p className="max-w-[14rem] truncate rounded-full bg-black/35 px-4 py-1 text-center text-[11px] font-medium tracking-wide text-white/70 sm:max-w-xs sm:text-xs">
                    <TypedUrl
                      key={upright ? "typing" : "idle"}
                      text={content.playerUrl ?? "tajlandia.com"}
                      active={upright}
                    />
                  </p>
                </div>
              </div>

              <div className="bg-white px-2 pb-2 pt-2">
                <div className="relative aspect-[1.95] w-full overflow-hidden rounded-[1.25rem] bg-black">
                  <AnimatedVideoCard
                    videoSrc="/video/video_card.mp4"
                    posterSrc={poster?.src}
                    alt={content.alt}
                    className="h-full w-full rounded-none"
                    interactionTargetRef={frameRef}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
