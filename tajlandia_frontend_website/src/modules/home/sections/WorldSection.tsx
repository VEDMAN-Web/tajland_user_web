import { Container } from "@/components/ui/Container";
import { HomeMedia } from "../components/HomeMedia";
import { AnimatedVideoCard } from "@/components/cards/AnimatedVideoCard";
import { ScrollAnimatedElement } from "@/components/animations/ScrollAnimatedElement";
import type { HomePageContent } from "../types/home.types";

type WorldSectionProps = {
  content: HomePageContent["world"];
};

export function WorldSection({ content }: WorldSectionProps) {
  const poster = content.video?.poster ?? content.image;

  if (!content.video && !content.image) {
    return null;
  }

  return (
    <section className="bg-white pb-[60px]" aria-label={content.alt}>
      <Container>
        <ScrollAnimatedElement animation="scale-in" duration={700} className="overflow-hidden rounded-[1.75rem] bg-[#111318] shadow-[0_28px_80px_rgba(11,31,77,0.18)] ring-1 ring-black/10">
          <div className="relative flex h-11 items-center gap-3 border-b border-white/5 bg-[#1a1d24] px-4 sm:h-12 sm:px-5">
            <div className="flex shrink-0 items-center gap-1.5" aria-hidden="true">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57] sm:h-3 sm:w-3" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e] sm:h-3 sm:w-3" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28c840] sm:h-3 sm:w-3" />
            </div>
            <div className="pointer-events-none absolute inset-x-0 flex justify-center px-16">
              <p className="max-w-[14rem] truncate rounded-full bg-black/35 px-4 py-1 text-center text-[11px] font-medium tracking-wide text-white/70 sm:max-w-xs sm:text-xs">
                {content.playerUrl ?? "tajlandia.com"}
              </p>
            </div>
          </div>

          <div className="relative aspect-[16/9] w-full overflow-hidden bg-black">
            <AnimatedVideoCard
              videoSrc="/video/video_card.mp4"
              posterSrc={poster?.src}
              alt={content.alt}
              className="w-full h-full"
            />
          </div>
        </ScrollAnimatedElement>
      </Container>
    </section>
  );
}
