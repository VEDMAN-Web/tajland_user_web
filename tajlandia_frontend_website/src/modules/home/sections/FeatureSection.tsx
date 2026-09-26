import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ScrollAnimatedElement } from "@/components/animations/ScrollAnimatedElement";
import { FeatureCard } from "../components/FeatureCard";
import type { HomePageContent } from "../types/home.types";

type FeatureSectionProps = {
  content: HomePageContent["features"];
};

export function FeatureSection({ content }: FeatureSectionProps) {
  if (content.items.length === 0) {
    return null;
  }

  return (
    <section className="bg-white pt-8 pb-[60px] sm:pt-9">
      <Container>
        <ScrollAnimatedElement animation="fade-in" duration={600}>
          <SectionHeading description={content.subtitle}>{content.heading}</SectionHeading>
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
