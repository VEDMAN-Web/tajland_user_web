import { Button } from "@/components/ui/Button";
import type { HomePageContent } from "../types/home.types";

type HeroFilmIntroProps = {
  content: HomePageContent["hero"];
};

function delay(ms: number) {
  return { "--rise-delay": `${ms}ms` } as React.CSSProperties;
}

/**
 * Opening title over the hero film: left-aligned editorial lock-up whose
 * lines are revealed from behind a mask, followed by a rule, copy and CTA.
 * HeroFilm moves the whole lock-up out (`data-film-intro`) once scrolling starts.
 */
export function HeroFilmIntro({ content }: HeroFilmIntroProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center px-6 sm:px-12 lg:px-[8vw] max-md:items-end max-md:pb-24 [@media(max-height:500px)]:items-center [@media(max-height:500px)]:pb-0">
      <div className="mx-auto flex w-full max-w-[1440px] max-md:justify-center">
        <div
          data-film-intro
          className="pointer-events-auto w-full max-w-[620px] will-change-[transform,opacity] max-md:text-center"
        >
          <h1 className="font-[family-name:var(--font-playfair-display)] text-[84px] font-semibold leading-[0.98] tracking-[-0.05em] text-white [text-shadow:0_2px_32px_rgba(7,21,54,0.45)] max-[1023px]:text-[64px] max-[767px]:text-[44px] [@media(max-height:500px)]:text-[36px]">
            <span className="hero-film-mask">
              <span style={delay(150)}>{content.title}</span>
            </span>{" "}
            <span className="hero-film-mask">
              <span style={delay(300)}>
                {content.titleContinue ? `${content.titleContinue} ` : null}
                <span className="italic text-brand-red">{content.titleAccent}</span>
              </span>
            </span>
          </h1>
          <span
            aria-hidden="true"
            style={delay(650)}
            className="hero-film-rule mt-8 block h-px w-24 origin-left bg-white/60 max-md:mx-auto max-md:origin-center [@media(max-height:500px)]:mt-4"
          />
          {content.subtitle ? (
            <p
              style={delay(750)}
              className="hero-film-rise mt-6 max-w-[460px] font-[family-name:var(--font-manrope)] text-[18px] leading-[1.6] text-white/85 max-md:mx-auto max-[767px]:text-[15px] [@media(max-height:500px)]:mt-3 [@media(max-height:500px)]:text-[13px]"
            >
              {content.subtitle}
            </p>
          ) : null}
          {content.cta ? (
            <div style={delay(900)} className="hero-film-rise mt-9 [@media(max-height:500px)]:mt-4">
              <Button
                href={content.cta.href}
                variant="inverse"
                size="sm"
                className="h-14 w-[222px] rounded-full px-6 py-3 [@media(max-height:500px)]:h-11"
              >
                {content.cta.label}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
