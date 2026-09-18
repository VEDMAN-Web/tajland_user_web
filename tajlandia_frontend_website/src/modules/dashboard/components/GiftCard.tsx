import { cn } from "@/lib/utils/cn";

type GiftCardProps = {
  onGift?: () => void;
  className?: string;
};

/**
 * "Give a Little Piece of Thailand" CTA card.
 * Figma: bg #fff7f7, border brand-red, radius 18px, p-20/24
 * Title: 30px/600 Manrope #111111
 * Body: 14px/400 Manrope #818d97
 * Button: bg brand-red, rounded-full, 16px/500 Manrope white
 * Footer: 12px/700 muted, divider brand-red/15
 */
export function GiftCard({ onGift, className }: GiftCardProps) {
  return (
    <div
      className={cn(
        "rounded-[18px] border border-[#e00c1b] bg-[#fff7f7] p-5 sm:p-6",
        className,
      )}
    >
      {/* Icon badge */}
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e00c1b]">
        {/* Gift ribbon SVG */}
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
          <path d="M11 6.5V19M11 6.5C11 6.5 11 3 8.5 3C6.5 3 6 4.5 6 5.5C6 7.5 8.5 6.5 11 6.5ZM11 6.5C11 6.5 11 3 13.5 3C15.5 3 16 4.5 16 5.5C16 7.5 13.5 6.5 11 6.5Z" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          <rect x="4" y="6.5" width="14" height="3" rx="1.5" stroke="white" strokeWidth="1.5"/>
          <rect x="5.5" y="9.5" width="11" height="9.5" rx="1.5" stroke="white" strokeWidth="1.5"/>
        </svg>
      </div>

      {/* Eyebrow */}
      <p className="mt-5 font-[family-name:var(--font-manrope)] text-[12px] font-bold uppercase tracking-[0.08em] text-[#e00c1b]">
        Give a little piece
      </p>

      {/* Heading — Figma: 30px/600 */}
      <h2 className="mt-2 max-w-[280px] font-[family-name:var(--font-manrope)] text-[24px] font-semibold leading-[30px] text-[#111111] sm:text-[30px] sm:leading-[36px]">
        Give a Little Piece of Thailand
      </h2>

      {/* Body — Figma: 14px/400 muted */}
      <p className="mt-3 max-w-[320px] font-[family-name:var(--font-manrope)] text-[14px] font-normal leading-[22.75px] text-[#818d97]">
        Share a place worth remembering. Gift a Tajlandia plot to someone special
        and let them build their own collection.
      </p>

      {/* CTA — Figma: bg #e00c1b, pill, 16px/500 white */}
      <button
        type="button"
        onClick={onGift}
        className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-[#e00c1b] px-5 py-2.5 font-[family-name:var(--font-manrope)] text-[16px] font-medium leading-[18px] text-white transition-opacity hover:opacity-90"
      >
        Gift a plot →
      </button>

      {/* Footer badges */}
      <div className="mt-5 border-t border-[#e00c1b]/15 pt-4">
        <p className="font-[family-name:var(--font-manrope)] text-[12px] font-bold text-[#818d97]">
          ✓ Instant Digital Certificate &nbsp;&nbsp; ✓ Official Cadastre Deed
        </p>
      </div>
    </div>
  );
}
