import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
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
    <section className="bg-white py-16 md:py-24">
      <Container>
        <SectionHeading description={content.subtitle}>{content.heading}</SectionHeading>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {content.items.map((item) => (
            <FeatureCard key={item.id} item={item} />
          ))}
        </div>
      </Container>
    </section>
  );
}
