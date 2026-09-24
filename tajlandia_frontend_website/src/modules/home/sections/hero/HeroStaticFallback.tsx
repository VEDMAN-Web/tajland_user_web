import { HomeMedia } from "../../components/HomeMedia";
import { Button } from "@/components/ui/Button";
import { GetInTouchLauncher } from "../../components/GetInTouchLauncher";
import type { HomePageContent } from "../../types/home.types";

type HeroStaticFallbackProps = {
  content: HomePageContent["hero"];
  heading: string;
};

/** Accessible / reduced-motion hero — preserves brand message without WebGL. */
export function HeroStaticFallback({
  content,
  heading,
}: HeroStaticFallbackProps) {
  return (
    <section
      className="relative w-full min-h-[100svh] overflow-hidden"
      aria-label={heading || undefined}
    >
      <div className="absolute inset-0 z-0 h-full w-full min-h-[100svh]">
        {content.image ? (
          <HomeMedia
            image={content.image}
            fill
            priority
            sizes="100vw"
            className="h-full w-full max-w-none object-cover object-center"
          />
        ) : (
          <div className="h-full w-full bg-sky-200" aria-hidden="true" />
        )}
      </div>
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-white/35 via-white/5 to-transparent" />
      <div className="relative z-20 flex min-h-[100svh] w-full justify-center px-5 pb-16 pt-[14vh] text-center sm:px-8 sm:pt-[16vh] md:pt-[18vh]">
        <div className="w-full max-w-[760px] text-navy">
          <h1 className="font-[family-name:var(--font-playfair-display)] text-[68px] font-semibold leading-[1.04] tracking-[-0.055em] max-[767px]:text-[48px]">
            <span className="block">{content.title}</span>
            <span className="block">
              {content.titleContinue ? `${content.titleContinue} ` : null}
              <span className="italic text-brand-red">{content.titleAccent}</span>
            </span>
          </h1>
          {content.subtitle ? (
            <p className="mx-auto mt-6 max-w-[780px] font-[family-name:var(--font-manrope)] text-[24px] font-normal leading-[1.35] text-[#718096] max-[767px]:text-[17px]">
              {content.subtitle}
            </p>
          ) : null}
          {content.cta ? (
            <Button
              href={content.cta.href}
              size="sm"
              className="mt-8 h-14 w-[222px] rounded-full bg-navy px-6 py-3 text-white hover:bg-[#13285f]"
            >
              {content.cta.label}
            </Button>
          ) : null}
        </div>
      </div>
      <GetInTouchLauncher />
    </section>
  );
}
