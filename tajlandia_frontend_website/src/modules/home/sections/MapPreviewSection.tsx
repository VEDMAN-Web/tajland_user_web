import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ScrollAnimatedElement } from "@/components/animations/ScrollAnimatedElement";
import { ThailandMap } from "../components/ThailandMap";
import type { HomePageContent } from "../types/home.types";

type MapPreviewSectionProps = {
  content: HomePageContent["map"];
};

export function MapPreviewSection({ content }: MapPreviewSectionProps) {
  const headingLead = content.headingBefore.replace(/\s+experience$/, "");
  const map = <ThailandMap pins={content.pins} />;

  return (
    <section id="map" className="bg-white py-[60px]">
      <Container>
        <div className="mb-[60px] grid items-end gap-8 lg:mb-[60px] lg:grid-cols-[1fr_0.72fr] lg:gap-12">
          <ScrollAnimatedElement animation="slide-in-left" duration={700}>
            <p className="mb-4 font-display text-[18px] text-navy">
              What you <span className="italic text-brand-red">Receive</span>
            </p>
            <h2 className="max-w-[600px] font-display text-[42px] font-semibold leading-[0.98] tracking-[-0.04em] text-navy sm:text-[54px] lg:text-[60px]">
              {headingLead}
              <br />
              experience <span className="italic text-brand-red">{content.headingAccent}.</span>
              {content.headingAfter ? ` ${content.headingAfter}` : null}
            </h2>
          </ScrollAnimatedElement>
          <ScrollAnimatedElement animation="slide-in-right" duration={700}>
            <p className="max-w-[560px] justify-self-start text-[22px] leading-7 text-muted lg:justify-self-end lg:pb-1 lg:text-right">
              {content.description ?? "Explore the map, discover a place that resonates with you, and claim its story as your own."}
            </p>
          </ScrollAnimatedElement>
        </div>

        <ScrollAnimatedElement animation="scale-in" duration={800} className="relative overflow-hidden rounded-[2rem] bg-[#eaf8f8] p-2 shadow-[0_16px_50px_rgba(11,31,77,0.08)] sm:p-3">
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
