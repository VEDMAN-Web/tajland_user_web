import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { ScrollAnimatedElement } from "@/components/animations/ScrollAnimatedElement";
import { routes } from "@/lib/constants/routes";
import { HomeMedia } from "../components/HomeMedia";
import type { HomePageContent } from "../types/home.types";

type TestimonialsSectionProps = {
  content: HomePageContent["testimonials"];
};

export function TestimonialsSection({ content }: TestimonialsSectionProps) {
  const [featured] = content.items;

  if (!featured) {
    return null;
  }

  return (
    <section id="certificate" className="bg-gradient-to-b from-white to-[#f8fafb] py-[60px] lg:py-[80px]">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_0.82fr] lg:gap-20">
          <ScrollAnimatedElement
            animation="slide-in-left"
            duration={800}
            delay={0}
            threshold={0.1}
            className="min-w-0 lg:pl-8"
          >
            <div className="space-y-5">
              <p className="font-display text-[15px] text-navy">
                {content.eyebrow} <span className="italic text-brand-red">Keepsake</span>
              </p>
              <h2 className="mt-5 max-w-[450px] font-display text-[47px] leading-[1.03] tracking-[-0.04em] text-navy sm:text-[56px]">
                {content.headingBefore}
                <br />
                worth <span className="italic text-brand-red">{content.headingAccent}.</span>
              </h2>
              <p className="mt-6 max-w-[500px] text-[16px] leading-6 text-foreground">
                {featured.quote}
              </p>
              <Button href={routes.explore} className="mt-7" size="md">
                Get yours →
              </Button>
            </div>
          </ScrollAnimatedElement>
          <ScrollAnimatedElement
            animation="slide-in-right"
            duration={800}
            delay={200}
            threshold={0.1}
            className="flex min-w-0 justify-center lg:justify-end"
          >
            <figure className="drop-shadow-lg transition-transform duration-500 hover:scale-105">
              {featured.image ? (
                <HomeMedia
                  image={featured.image}
                  priority
                  sizes="(max-width: 1024px) 80vw, 390px"
                  className="h-auto w-full max-w-[350px] object-contain"
                />
              ) : null}
            </figure>
          </ScrollAnimatedElement>
        </div>
      </Container>
    </section>
  );
}
