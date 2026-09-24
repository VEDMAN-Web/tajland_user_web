"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { GetInTouchLauncher } from "../../components/GetInTouchLauncher";
import type { HomePageContent } from "../../types/home.types";
import { resolveHeroStoryData } from "./data/heroStoryData";
import { HERO_SCROLL } from "./heroAnimationConfig";
import { HeroCinematicStage } from "./HeroCinematicStage";
import { HeroOverlay } from "./HeroOverlay";
import { HeroStaticFallback } from "./HeroStaticFallback";

type TajlandiaHeroProps = {
  content: HomePageContent["hero"];
  pins?: HomePageContent["map"]["pins"];
};

function heroHeading(content: HomePageContent["hero"]) {
  return [content.title, content.titleContinue, content.titleAccent]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function subscribeMediaQuery(query: string, onChange: () => void) {
  const mq = window.matchMedia(query);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function useMediaQuery(query: string, serverFallback = false): boolean {
  return useSyncExternalStore(
    (onStoreChange) => subscribeMediaQuery(query, onStoreChange),
    () => window.matchMedia(query).matches,
    () => serverFallback,
  );
}

/**
 * Reposé-inspired sticky cinematic hero:
 * photographic layers + GSAP ScrollTrigger scrub (continuous zoom / crossfade).
 */
export function TajlandiaHero({ content, pins }: TajlandiaHeroProps) {
  const heading = heroHeading(content);
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)", false);
  const isMobile = useMediaQuery("(max-width: 767px)", false);
  const story = useMemo(() => resolveHeroStoryData(pins), [pins]);

  const sectionRef = useRef<HTMLElement>(null);
  const landscapeRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const regionRef = useRef<HTMLDivElement>(null);
  const pinsRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const hazeRef = useRef<HTMLDivElement>(null);

  const [progress, setProgress] = useState(0);

  const landscapeSrc = content.image?.src ?? "/images/home/hero-reference.jpg";
  const landscapeAlt = content.image?.alt ?? "Thailand";
  const mapSrc = "/images/home/map.png";
  const regionSrc = story.featuredPlot.image ?? "/images/explore/phuket.jpg";
  const trackVh = isMobile
    ? HERO_SCROLL.mobileTrackVh
    : HERO_SCROLL.desktopTrackVh;

  useEffect(() => {
    if (reducedMotion) return;

    let ctx: { revert: () => void } | undefined;
    let killed = false;

    const setup = async () => {
      const gsapModule = await import("gsap");
      const scrollModule = await import("gsap/ScrollTrigger");
      if (killed || !sectionRef.current) return;

      const gsap = gsapModule.default;
      const { ScrollTrigger } = scrollModule;
      gsap.registerPlugin(ScrollTrigger);

      const landscape = landscapeRef.current;
      const map = mapRef.current;
      const region = regionRef.current;
      const pinsEl = pinsRef.current;
      const grid = gridRef.current;
      const haze = hazeRef.current;
      if (!landscape || !map || !region || !pinsEl || !grid || !haze) return;

      ctx = gsap.context(() => {
        // Explicit start state — later fromTo must not immediateRender
        gsap.set(landscape, { scale: 1, yPercent: 0, opacity: 1 });
        gsap.set(map, { opacity: 0, scale: 0.7, yPercent: 12 });
        gsap.set(region, { opacity: 0, scale: 1.18 });
        gsap.set(pinsEl, { opacity: 0 });
        gsap.set(grid, { opacity: 0, scale: 0.94, yPercent: 4 });
        gsap.set(haze, { opacity: 0.5 });

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "bottom bottom",
            scrub: isMobile ? 0.4 : 0.9,
            onUpdate: (self) => setProgress(self.progress),
          },
        });

        // Continuous photographic zoom into Thailand
        tl.to(
          landscape,
          { scale: isMobile ? 1.32 : 1.5, yPercent: -5, duration: 0.35 },
          0,
        );
        tl.to(haze, { opacity: 0.18, duration: 0.3 }, 0);

        // Map enters frame — seamless crossfade
        tl.to(
          map,
          { opacity: 1, scale: 1, yPercent: 0, duration: 0.22 },
          0.2,
        );
        tl.to(landscape, { opacity: 0, duration: 0.16 }, 0.22);

        // Map advances toward viewer
        tl.to(
          map,
          { scale: isMobile ? 1.22 : 1.4, yPercent: -3, duration: 0.2 },
          0.38,
        );

        // Destination markers
        tl.to(pinsEl, { opacity: 1, duration: 0.12 }, 0.42);
        tl.to(pinsEl, { opacity: 0, duration: 0.1 }, 0.55);

        // Dive into region aerial photography
        tl.to(region, { opacity: 1, scale: 1, duration: 0.18 }, 0.5);
        tl.to(map, { opacity: 0, duration: 0.12 }, 0.52);
        tl.to(landscape, { opacity: 0, duration: 0.1 }, 0.52);
        tl.to(
          region,
          { scale: isMobile ? 1.18 : 1.32, duration: 0.22 },
          0.62,
        );

        // Plot grid over land
        tl.to(
          grid,
          { opacity: 1, scale: 1, yPercent: 0, duration: 0.14 },
          0.66,
        );

        // Soft return to editorial close
        tl.to(grid, { opacity: 0, scale: 1.06, duration: 0.1 }, 0.84);
        tl.to(region, { scale: 1.06, opacity: 0.45, duration: 0.12 }, 0.86);
        tl.to(haze, { opacity: 0.4, duration: 0.1 }, 0.88);
        tl.to(
          landscape,
          { opacity: 0.9, scale: 1.1, yPercent: 0, duration: 0.14 },
          0.88,
        );
      }, sectionRef);

      ScrollTrigger.refresh();
    };

    void setup();

    return () => {
      killed = true;
      ctx?.revert();
    };
  }, [reducedMotion, isMobile, trackVh]);

  if (reducedMotion) {
    return <HeroStaticFallback content={content} heading={heading} />;
  }

  return (
    <section
      ref={sectionRef}
      className="relative w-full"
      style={{ height: `${trackVh}vh` }}
      aria-label={heading || "TajLandia hero story"}
    >
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
        <HeroCinematicStage
          landscapeSrc={landscapeSrc}
          landscapeAlt={landscapeAlt}
          mapSrc={mapSrc}
          regionSrc={regionSrc}
          story={story}
          landscapeRef={landscapeRef}
          mapRef={mapRef}
          regionRef={regionRef}
          pinsRef={pinsRef}
          gridRef={gridRef}
          hazeRef={hazeRef}
        />
        <HeroOverlay
          content={content}
          progress={progress}
          plot={story.featuredPlot}
        />
        <GetInTouchLauncher />
      </div>
    </section>
  );
}
