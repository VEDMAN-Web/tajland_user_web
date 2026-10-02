import { HomeMedia } from "../components/HomeMedia";
import { Button } from "@/components/ui/Button";
import { GetInTouchLauncher } from "../components/GetInTouchLauncher";
import { HeroFilm } from "../components/HeroFilm";
import { HeroFilmIntro } from "../components/HeroFilmIntro";
import { HeroStoryBlock } from "../components/HeroStoryBlock";
import { ScrollAnimatedElement } from "@/components/animations/ScrollAnimatedElement";
import type { HomePageContent } from "../types/home.types";

type HeroSectionProps = {
  content: HomePageContent["hero"];
};

function heroHeading(content: HomePageContent["hero"]) {
  return [content.title, content.titleContinue, content.titleAccent]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

type HeroFilmSectionProps = {
  content: HomePageContent["hero"];
  film: NonNullable<HomePageContent["hero"]["film"]>;
  heading: string;
};

function HeroFilmSection({ content, film, heading }: HeroFilmSectionProps) {
  const story = content.story ?? [];

  return (
    <section className="relative w-full" aria-label={heading || undefined}>
      <HeroFilm
        film={film}
        className="h-[420svh] md:h-[560svh]"
        poster={
          <HomeMedia
            image={film.poster}
            fill
            priority
            sizes="100vw"
            className="h-full w-full max-w-none object-cover object-center"
          />
        }
        finale={
          film.finale ? (
            <HomeMedia
              image={film.finale}
              fill
              sizes="100vw"
              className="h-full w-full max-w-none object-cover"
            />
          ) : undefined
        }
      >
        {/* Base scrim: keeps the header edge and bottom chrome readable. */}
        <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(180deg,rgba(7,21,54,0.35)_0%,transparent_30%,transparent_65%,rgba(7,21,54,0.55)_100%)]" />
        {/* Intro scrim: strong over the bright clouds, gone once the story starts. */}
        <div className="hero-film-intro-scrim pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(90deg,rgba(7,21,54,0.78)_0%,rgba(7,21,54,0.45)_40%,rgba(7,21,54,0.1)_75%)] max-md:bg-[linear-gradient(0deg,rgba(7,21,54,0.85)_0%,rgba(7,21,54,0.45)_50%,rgba(7,21,54,0.15)_100%)]" />

        <HeroFilmIntro content={content} />

        {story.map((block) => (
          <HeroStoryBlock key={block.id} block={block} />
        ))}

        {story.length ? (
          <ol
            aria-hidden="true"
            className="pointer-events-none absolute right-6 top-1/2 z-20 hidden -translate-y-1/2 flex-col gap-5 font-[family-name:var(--font-manrope)] text-[12px] font-semibold tracking-[0.2em] lg:flex"
          >
            {story.map((block, index) => (
              <li
                key={block.id}
                data-film-chapter
                data-from={block.from}
                data-to={block.to}
                className="flex items-center justify-end gap-3 text-white/40 transition-colors duration-500 data-[active=true]:text-white [&[data-active=true]>span]:w-10 [&[data-active=true]>span]:bg-brand-red"
              >
                {String(index + 1).padStart(2, "0")}
                <span className="h-px w-5 bg-white/40 transition-[width,background-color] duration-500" />
              </li>
            ))}
          </ol>
        ) : null}

        <div
          data-film-hint
          aria-hidden="true"
          className="pointer-events-none absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-3 font-[family-name:var(--font-manrope)] text-[11px] font-semibold uppercase tracking-[0.4em] text-white/80 max-md:hidden [@media(max-height:500px)]:hidden"
        >
          Scroll
          <span className="hero-film-cue relative h-12 w-px overflow-hidden bg-white/25" />
        </div>

        <div
          aria-hidden="true"
          className="hero-film-progress pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[3px] origin-left bg-brand-red"
        />

        <GetInTouchLauncher />
      </HeroFilm>
    </section>
  );
}

export function HeroSection({ content }: HeroSectionProps) {
  const heading = heroHeading(content);

  if (content.film) {
    return <HeroFilmSection content={content} film={content.film} heading={heading} />;
  }

  return (
    <section
      className="relative h-[calc(100dvh-4.5rem)] w-full overflow-hidden sm:h-[calc(100dvh-5rem)]"
      aria-label={heading || undefined}
    >
      <div className="absolute inset-0 z-0">
        {content.image ? (
          <HomeMedia
            image={content.image}
            fill
            priority
            sizes="100vw"
            className="h-full w-full max-w-none object-cover object-center"
          />
        ) : (
          <div className="absolute inset-0 bg-sky-200" aria-hidden="true" />
        )}
      </div>
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-white/35 via-white/5 to-transparent" />
      <div className="absolute inset-0 z-20 flex w-full justify-center px-5 pt-[10vh] text-center sm:px-8 sm:pt-[12vh] md:pt-[14vh]">
        <ScrollAnimatedElement animation="slide-in-up" duration={800} className="w-full max-w-[760px] text-navy">
          <h1 className="font-[family-name:var(--font-playfair-display)] text-[68px] font-semibold leading-[1.04] tracking-[-0.055em] max-[767px]:text-[48px]">
            <span className="block">{content.title}</span>{" "}
            <span className="block">
              {content.titleContinue ? `${content.titleContinue} ` : null}
              <span className="italic text-brand-red">{content.titleAccent}</span>
            </span>
          </h1>
          {content.subtitle ? (
            <p className="mx-auto mt-6 max-w-[780px] font-[family-name:var(--font-manrope)] text-[24px] font-normal leading-[1.35] text-[#718096] max-[767px]:text-[17px]">
              {content.subtitle}
            </p>
          ) : null}
          {content.cta ? (
            <Button href={content.cta.href} size="sm" className="mt-8 h-14 w-[222px] rounded-full bg-navy px-6 py-3 text-white hover:bg-[#13285f]">
              {content.cta.label}
            </Button>
          ) : null}
        </ScrollAnimatedElement>
      </div>
      <GetInTouchLauncher />
    </section>
  );
}
