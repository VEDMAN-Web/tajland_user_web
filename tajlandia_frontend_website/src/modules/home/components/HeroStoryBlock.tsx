import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";
import type { HomeHeroStoryBlock } from "../types/home.types";

type HeroStoryBlockProps = {
  block: HomeHeroStoryBlock;
};

const alignClasses: Record<HomeHeroStoryBlock["align"], string> = {
  left: "md:justify-start",
  right: "md:justify-end",
  center: "md:justify-center md:text-center",
};

// Side scrim behind the copy; fades with the block via `--block-visible`.
const scrimClasses: Record<HomeHeroStoryBlock["align"], string> = {
  left: "md:bg-[linear-gradient(90deg,rgba(7,21,54,0.72)_0%,rgba(7,21,54,0.35)_38%,transparent_62%)]",
  right: "md:bg-[linear-gradient(270deg,rgba(7,21,54,0.72)_0%,rgba(7,21,54,0.35)_38%,transparent_62%)]",
  center: "md:bg-[radial-gradient(ellipse_at_center,rgba(7,21,54,0.6)_0%,transparent_65%)]",
};

// Lines start hidden; HeroFilm reveals them as the scroll reaches `from`.
const lineClass = "invisible opacity-0 will-change-[transform,opacity]";

/** One scroll-choreographed text block over the hero film. */
export function HeroStoryBlock({ block }: HeroStoryBlockProps) {
  const centered = block.align === "center";

  return (
    <div
      data-film-block
      data-from={block.from}
      data-to={block.to}
      data-hold={block.to >= 1 ? "true" : undefined}
      className={cn(
        "pointer-events-none absolute inset-0 z-20 flex items-center px-6 sm:px-12 lg:px-[8vw] max-md:items-end max-md:pb-20",
        // Right-hand copy sits closer to the edge, just clear of the chapter rail.
        block.align === "right" && "lg:pr-28",
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          "hero-film-block-scrim absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgba(7,21,54,0.8)_0%,rgba(7,21,54,0.4)_40%,transparent_70%)]",
          scrimClasses[block.align],
        )}
      />
      {/* Keeps blocks aligned with the site container on very wide screens. */}
      <div
        className={cn(
          "mx-auto flex w-full max-w-[1440px] justify-center text-center md:text-left",
          alignClasses[block.align],
        )}
      >
        <div
          className={cn(
            "w-full max-w-[540px]",
            centered && "max-w-[720px]",
            block.align === "right" && "md:max-w-[480px]",
          )}
        >
          {block.eyebrow ? (
            <p
              data-film-line
              className={cn(
                lineClass,
                "flex items-center justify-center gap-3 font-[family-name:var(--font-manrope)] text-[12px] font-semibold uppercase tracking-[0.32em] text-white/80 md:justify-start",
                centered && "md:justify-center",
              )}
            >
              <span className="h-px w-8 bg-brand-red" aria-hidden="true" />
              {block.eyebrow}
            </p>
          ) : null}
          <h2
            data-film-line
            className={cn(
              lineClass,
              "mt-5 font-[family-name:var(--font-playfair-display)] text-[64px] font-semibold leading-[1.02] tracking-[-0.045em] text-white [text-shadow:0_2px_28px_rgba(7,21,54,0.5)] max-[1023px]:text-[52px] max-[767px]:text-[36px] [@media(max-height:500px)]:mt-2 [@media(max-height:500px)]:text-[30px]",
            )}
          >
            <span className="block">{block.title}</span>
            {block.titleAccent ? (
              <span className="block italic text-brand-red">{block.titleAccent}</span>
            ) : null}
          </h2>
          {block.body ? (
            <p
              data-film-line
              className={cn(
                lineClass,
                "mt-6 max-w-[460px] font-[family-name:var(--font-manrope)] text-[18px] leading-[1.6] text-white/85 max-md:mx-auto max-[767px]:text-[15px] [@media(max-height:500px)]:mt-3 [@media(max-height:500px)]:text-[13px]",
                centered && "md:mx-auto",
              )}
            >
              {block.body}
            </p>
          ) : null}
          {block.cta ? (
            <div
              data-film-line
              className={cn(lineClass, "pointer-events-auto mt-9 [@media(max-height:500px)]:mt-4")}
            >
              <Button
                href={block.cta.href}
                variant="inverse"
                size="sm"
                className="h-14 w-[222px] rounded-full px-6 py-3 [@media(max-height:500px)]:h-11"
              >
                {block.cta.label}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
