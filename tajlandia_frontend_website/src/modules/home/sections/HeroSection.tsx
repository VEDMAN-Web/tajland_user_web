import { HomeMedia } from "../components/HomeMedia";
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

export function HeroSection({ content }: HeroSectionProps) {
  const heading = heroHeading(content);

  return (
    <section
      className="relative w-full min-h-[100svh] overflow-hidden"
      aria-label={heading || undefined}
    >
      {heading ? (
        <h1 className="pointer-events-none absolute h-px w-px overflow-hidden border-0 p-0 [clip:rect(0,0,0,0)]">
          {heading}
        </h1>
      ) : null}
      <div className="absolute inset-0 z-0 h-full w-full min-h-[100svh]">
        {content.image ? (
          <HomeMedia
            image={content.image}
            fill
            priority
            sizes="100vw"
            className="h-full w-full max-w-none object-cover object-center"
          />
        ) : (
          <div className="h-full w-full bg-sky-200" aria-hidden="true" />
        )}
      </div>
    </section>
  );
}
