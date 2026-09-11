import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { HomeMedia } from "../components/HomeMedia";
import type { HomePageContent } from "../types/home.types";

type CtaSectionProps = {
  content: HomePageContent["cta"];
};

export function CtaSection({ content }: CtaSectionProps) {
  return (
    <section className="bg-white pb-16 md:pb-24">
      <Container>
        <div className="relative min-h-[16rem] overflow-hidden rounded-[2rem] bg-navy text-white md:min-h-[18rem]">
          {content.image ? (
            <HomeMedia
              image={content.image}
              fill
              sizes="(min-width: 1280px) 1120px, 100vw"
              className="object-cover object-right"
            />
          ) : null}
          <div
            className="absolute inset-0 bg-gradient-to-r from-navy via-navy/85 to-navy/35"
            aria-hidden="true"
          />
          <div className="relative flex min-h-[16rem] max-w-xl flex-col justify-center px-8 py-12 md:min-h-[18rem] md:px-14">
            <h2 className="font-display text-4xl font-semibold md:text-5xl">
              {content.title}
            </h2>
            <p className="mt-4 text-white/80">{content.subtitle}</p>
            {content.cta ? (
              <Button href={content.cta.href} variant="inverse" className="mt-8 w-fit">
                {content.cta.label}
              </Button>
            ) : null}
          </div>
        </div>
      </Container>
    </section>
  );
}
