import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { ScrollAnimatedElement } from "@/components/animations/ScrollAnimatedElement";
import { routes } from "@/lib/constants/routes";
import { HomeMedia } from "../components/HomeMedia";
import type { HomePageContent } from "../types/home.types";

type TestimonialsSectionProps = {
  content: HomePageContent["testimonials"];
};

function splitKeepsakeHeading(headingBefore: string) {
  const words = headingBefore.trim().split(/\s+/);
  if (words.length < 2) {
    return { lead: headingBefore.trim(), bridge: "" };
  }

  const bridge = words.pop() ?? "";
  return { lead: words.join(" "), bridge };
}

export function TestimonialsSection({ content }: TestimonialsSectionProps) {
  const [featured] = content.items;

  if (!featured) {
    return null;
  }

  const heading = splitKeepsakeHeading(content.headingBefore);

  return (
    <section id="certificate" className="bg-white pb-16 pt-10 lg:pb-[88px] lg:pt-14">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16 xl:gap-24">
          <ScrollAnimatedElement
            animation="fade-in"
            duration={700}
            delay={0}
            threshold={0.1}
            className="min-w-0 lg:py-6"
          >
            <p className="font-[family-name:var(--font-playfair-display)] text-[18px] font-semibold leading-none text-navy sm:text-[20px]">
              {content.eyebrow} <span className="italic text-brand-red">Keepsake</span>
            </p>
            <h2 className="mt-5 font-[family-name:var(--font-playfair-display)] text-[46px] font-semibold leading-[1.02] tracking-[-0.03em] text-navy sm:mt-6 sm:text-[56px] lg:text-[64px]">
              {heading.lead}
              <br />
              {heading.bridge ? `${heading.bridge} ` : null}
              <span className="italic text-brand-red">{content.headingAccent}.</span>
            </h2>
            <p className="mt-6 max-w-[34rem] font-[family-name:var(--font-manrope)] text-[16px] font-normal leading-[1.5] text-[#8a99aa] sm:mt-7 sm:text-[17px]">
              {featured.quote}
            </p>
            <Button
              href={routes.explore}
              className="mt-8 h-12 px-7 text-[15px] sm:mt-9"
              size="md"
            >
              Get yours →
            </Button>
          </ScrollAnimatedElement>
          {featured.image ? (
            <figure className="mx-auto w-fit lg:mx-0 lg:justify-self-end">
              <HomeMedia
                image={featured.image}
                priority
                sizes="(max-width: 1024px) 86vw, 446px"
                className="h-[460px] w-auto max-w-full object-contain transition-transform duration-500 ease-out hover:scale-[1.03] sm:h-[540px] lg:h-[600px]"
              />
            </figure>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
