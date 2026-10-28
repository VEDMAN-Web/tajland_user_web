import Link from "next/link";
import type { MapRegion } from "@/components/maps/MapboxMap";
import { Container } from "@/components/ui/Container";
import { ScrollAnimatedElement } from "@/components/animations/ScrollAnimatedElement";
import { ScrollDirectionalReveal } from "@/components/animations/ScrollDirectionalReveal";
import type { Locale } from "@/lib/i18n/locale";
import { homeStrings } from "../data/home.strings";
import { ThailandMap } from "../components/ThailandMap";
import type { HomePageContent } from "../types/home.types";

type MapPreviewSectionProps = {
  content: HomePageContent["map"];
  regions?: MapRegion[];
  locale?: Locale;
};

const descriptionBreakAfter = "resonates";

function mapDescriptionLines(description: string) {
  const breakIndex = description.indexOf(descriptionBreakAfter);
  if (breakIndex === -1) {
    return [description];
  }

  const splitAt = breakIndex + descriptionBreakAfter.length;
  return [description.slice(0, splitAt).trim(), description.slice(splitAt).trim()].filter(
    Boolean,
  );
}

export function MapPreviewSection({ content, regions = [], locale = "en" }: MapPreviewSectionProps) {
  const strings = homeStrings[locale];
  // The last word of the heading ("experience") sits on its own line before the accent.
  const headingWords = content.headingBefore.trim().split(/\s+/);
  const headingLastWord = headingWords.length > 1 ? (headingWords.pop() ?? "") : "";
  const headingLead = headingWords.join(" ");
  const description = content.description ?? strings.mapDescription;
  const descriptionLines = mapDescriptionLines(description);
  const map = <ThailandMap pins={content.pins} regions={regions} locale={locale} />;

  return (
    <section id="map" className="bg-white py-[60px]">
      <Container>
        <div className="mb-12 grid items-end gap-6 lg:mb-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(16rem,0.72fr)] lg:gap-16">
          <ScrollDirectionalReveal reverseDelay={150}>
            <p className="mb-3 font-[family-name:var(--font-playfair-display)] text-[16px] text-navy sm:mb-4 sm:text-[18px]">
              {strings.mapEyebrow[0]} <span className="italic text-brand-red">{strings.mapEyebrow[1]}</span>
            </p>
            <h2 className="max-w-[640px] font-[family-name:var(--font-playfair-display)] text-[40px] font-semibold leading-[1.02] tracking-[-0.03em] text-navy sm:text-[52px] lg:text-[58px]">
              {headingLead}
              <br />
              {headingLastWord}{" "}
              <span className="italic text-brand-red">{content.headingAccent}.</span>
              {content.headingAfter ? ` ${content.headingAfter}` : null}
            </h2>
          </ScrollDirectionalReveal>
          <ScrollDirectionalReveal
            delay={150}
            reverseDelay={0}
            className="lg:mb-1 lg:justify-self-end"
          >
            <p className="max-w-[26rem] font-[family-name:var(--font-manrope)] text-[16px] font-normal leading-[1.5] text-[#718096] lg:ml-auto lg:text-right lg:text-[17px]">
              {descriptionLines[0]}
              {descriptionLines.slice(1).map((line) => (
                <span key={line}>
                  <br />
                  {line}
                </span>
              ))}
            </p>
          </ScrollDirectionalReveal>
        </div>

        <ScrollAnimatedElement
          animation="scale-in"
          duration={800}
          className="relative overflow-hidden rounded-[2rem] bg-[#eaf8f8] p-2 shadow-[0_16px_50px_rgba(11,31,77,0.08)] sm:p-3"
        >
          <div className="overflow-hidden rounded-[1.5rem]">
            {content.cta ? (
              <Link
                href={content.cta.href}
                className="block rounded-[1.5rem] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-navy"
                aria-label={content.cta.label}
              >
                {map}
              </Link>
            ) : (
              map
            )}
          </div>
        </ScrollAnimatedElement>
      </Container>
    </section>
  );
}
