import { Container } from "@/components/ui/Container";
import { ScrollAnimatedElement } from "@/components/animations/ScrollAnimatedElement";
import { FeatureCard } from "../components/FeatureCard";
import type { HomePageContent } from "../types/home.types";

type FeatureSectionProps = {
  content: HomePageContent["features"];
};

const headingAccent = "like to do?";
const descriptionBreakAfter = "digital";

function splitFeatureHeading(heading: string) {
  const accentIndex = heading.lastIndexOf(headingAccent);
  if (accentIndex <= 0) {
    return { lead: heading, accent: "" };
  }

  return {
    lead: heading.slice(0, accentIndex).trimEnd(),
    accent: heading.slice(accentIndex),
  };
}

function splitFeatureDescription(subtitle?: string) {
  if (!subtitle) {
    return [];
  }

  const breakIndex = subtitle.indexOf(descriptionBreakAfter);
  if (breakIndex === -1) {
    return [subtitle];
  }

  const splitAt = breakIndex + descriptionBreakAfter.length;
  return [subtitle.slice(0, splitAt).trim(), subtitle.slice(splitAt).trim()].filter(Boolean);
}

export function FeatureSection({ content }: FeatureSectionProps) {
  if (content.items.length === 0) {
    return null;
  }

  const heading = splitFeatureHeading(content.heading);
  const descriptionLines = splitFeatureDescription(content.subtitle);

  return (
    <section className="bg-white pb-[60px]">
      <Container>
        <ScrollAnimatedElement animation="fade-in" duration={600}>
          <div className="mx-auto mt-12 mb-12 max-w-[760px] text-center md:mb-14">
            <h2 className="font-[family-name:var(--font-playfair-display)] text-[42px] font-semibold leading-[1.08] tracking-[-0.03em] text-navy sm:text-[52px] lg:text-[56px]">
              {heading.lead}
              {heading.accent ? (
                <>
                  {" "}
                  <span className="italic text-brand-red">{heading.accent}</span>
                </>
              ) : null}
            </h2>
            {descriptionLines.length > 0 ? (
              <p className="mx-auto mt-4 font-[family-name:var(--font-manrope)] text-[15px] font-normal leading-[1.55] text-[#718096] sm:mt-5 sm:text-[17px]">
                {descriptionLines[0]}
                {descriptionLines.slice(1).map((line) => (
                  <span key={line}>
                    <br />
                    {line}
                  </span>
                ))}
              </p>
            ) : null}
          </div>
        </ScrollAnimatedElement>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {content.items.map((item, index) => (
            <ScrollAnimatedElement
              key={item.id}
              animation="fade-in-scale"
              duration={600}
              delay={index * 100}
            >
              <FeatureCard item={item} />
            </ScrollAnimatedElement>
          ))}
        </div>
      </Container>
    </section>
  );
}
