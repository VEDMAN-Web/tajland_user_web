import { Container } from "@/components/ui/Container";
import { HowItWorksIcon } from "../components/HowItWorksIcon";
import type { HomePageContent } from "../types/home.types";

type HowItWorksSectionProps = {
  content: HomePageContent["howItWorks"];
};

export function HowItWorksSection({ content }: HowItWorksSectionProps) {
  if (content.steps.length === 0) {
    return null;
  }

  const stepLabels = ["EXPLORE", "CHOOSE", "CLAIM", "CERTIFICATE"];

  return (
    <section id="how-it-works" className="bg-white py-[60px]">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-[39px] leading-none tracking-[-0.04em] text-navy sm:text-[45px]">
            How It <span className="italic text-brand-red">Works</span>
          </h2>
          <p className="mx-auto mt-3 max-w-[430px] text-[17px] leading-5 text-[#8a99aa]">
            A seamless process to acquire and showcase
            <br className="hidden sm:block" /> your digital collectible.
          </p>
        </div>

        <ol className="relative mt-14 grid list-none gap-10 p-0 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4 lg:gap-6 before:hidden lg:before:absolute lg:before:left-[12.5%] lg:before:right-[12.5%] lg:before:top-[30px] lg:before:block lg:before:h-px lg:before:bg-[#dfe7ef]">
          {content.steps.map((step, index) => (
            <li key={step.id} className="relative z-10 min-w-0 text-center">
              <span
                className="mx-auto flex h-[60px] w-[60px] items-center justify-center"
              >
                <HowItWorksIcon name={step.icon} />
              </span>
              <p className="mt-5 text-[10px] font-medium text-brand-red">
                {String(index + 1).padStart(2, "0")} {stepLabels[index] ?? step.id.toUpperCase()}
              </p>
              <h3 className="mt-2 text-[17px] font-semibold tracking-[-0.02em] text-navy">
                {step.title}
              </h3>
              <p className="mx-auto mt-2 max-w-[220px] text-[13px] leading-5 text-[#8a99aa]">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
