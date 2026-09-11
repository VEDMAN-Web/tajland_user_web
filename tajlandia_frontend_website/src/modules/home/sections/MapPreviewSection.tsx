import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ThailandMap } from "../components/ThailandMap";
import type { HomePageContent } from "../types/home.types";

type MapPreviewSectionProps = {
  content: HomePageContent["map"];
};

export function MapPreviewSection({ content }: MapPreviewSectionProps) {
  const map = <ThailandMap pins={content.pins} />;

  return (
    <section className="bg-[#F4F6FB] py-16 md:py-24">
      <Container>
        <SectionHeading>
          {content.headingBefore}{" "}
          <span className="italic text-brand-red">{content.headingAccent}</span>
          {content.headingAfter ? ` ${content.headingAfter}` : null}
        </SectionHeading>
        {content.description ? (
          <p className="mx-auto mb-10 max-w-2xl text-center text-muted">
            {content.description}
          </p>
        ) : null}
        <div className="overflow-hidden rounded-[2rem] bg-white px-4 py-8 shadow-[0_16px_50px_rgba(11,31,77,0.08)] md:px-10">
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
      </Container>
    </section>
  );
}
