import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { ScrollAnimatedElement } from "@/components/animations/ScrollAnimatedElement";
import type { HomePageContent } from "../types/home.types";

type CtaSectionProps = {
  content: HomePageContent["cta"];
};

export function CtaSection({ content }: CtaSectionProps) {
  return (
    <section className="bg-gradient-to-b from-[#f8fafb] to-white pb-[60px] lg:pb-[80px] pt-[40px]">
      <Container>
        <ScrollAnimatedElement
          animation="fade-in-scale"
          duration={900}
          threshold={0.1}
          className="relative flex min-h-[23.5rem] flex-col items-center justify-center overflow-hidden rounded-[2rem] bg-[radial-gradient(ellipse_at_18%_58%,rgba(207,224,241,0.95)_0%,rgba(125,177,225,0.72)_21%,transparent_46%),radial-gradient(ellipse_at_80%_67%,rgba(235,91,106,0.96)_0%,rgba(196,83,111,0.76)_22%,transparent_48%),linear-gradient(180deg,#03184a_0%,#0b3478_34%,#376eaf_64%,#6c7fae_100%)] px-6 py-12 text-center text-white shadow-2xl md:min-h-[23.5rem] transition-all duration-500 hover:shadow-3xl"
        >
          <div
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,rgba(229,238,248,0.24),transparent_43%),repeating-radial-gradient(ellipse_at_20%_20%,rgba(255,255,255,0.035)_0,rgba(255,255,255,0.035)_1px,transparent_1px,transparent_4px)]"
            aria-hidden="true"
          />
          <div className="relative z-10 flex flex-col items-center space-y-4">
            <h2 className="font-display text-[38px] font-semibold leading-[0.98] tracking-[-0.03em] md:text-[48px] transition-all duration-500">
              {content.title}
              <br />
              <span className="italic">Thailand is waiting.</span>
            </h2>
            <p className="mt-4 text-[16px] text-white/90 transition-all duration-500">
              {content.subtitle}
            </p>
            {content.cta ? (
              <div className="group">
                <Button
                  href={content.cta.href}
                  variant="inverse"
                  className="mt-8 w-fit transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg"
                >
                  {content.cta.label}
                </Button>
              </div>
            ) : null}
            <p className="mt-5 text-[15px] text-white/90 transition-all duration-500">
              No spam. Just important news and good news.
            </p>
          </div>
        </ScrollAnimatedElement>
      </Container>
    </section>
  );
}
