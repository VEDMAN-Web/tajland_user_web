import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { HowItWorksIcon } from "../components/HowItWorksIcon";
import type { HomePageContent } from "../types/home.types";

type HowItWorksSectionProps = {
  content: HomePageContent["howItWorks"];
};

export function HowItWorksSection({ content }: HowItWorksSectionProps) {
  if (content.steps.length === 0) {
    return null;
  }

  return (
    <section className="bg-white py-16 md:py-24">
      <Container>
        <SectionHeading>{content.heading}</SectionHeading>
        <ol className="grid list-none gap-10 p-0 sm:grid-cols-2 lg:grid-cols-4">
          {content.steps.map((step) => (
            <li key={step.id} className="min-w-0 text-center">
              <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-white text-brand-red shadow-[0_10px_30px_rgba(11,31,77,0.08)] ring-1 ring-line">
                <HowItWorksIcon name={step.icon} />
              </span>
              <h3 className="text-lg font-semibold text-navy">{step.title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted">{step.description}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
