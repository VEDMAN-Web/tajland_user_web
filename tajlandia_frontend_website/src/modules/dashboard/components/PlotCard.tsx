import Image from "next/image";
import Link from "next/link";
import { routes } from "@/lib/constants/routes";
import { cn } from "@/lib/utils/cn";

type PlotCardProps = {
  imageSrc: string;
  regionLabel?: string;
  name: string;
  location: string;
  rai: number;
  pricePerRai: number;
  totalPrice: number;
  href?: string;
  className?: string;
};

/**
 * Plot / purchase card — matches Figma "Recent Purchase" cards.
 * Figma: rounded-16, bg-white, shadow-card, image 58×58 rounded-10,
 *        name 14px/600 Manrope, location+price 12px muted
 */
export function PlotCard({
  imageSrc,
  regionLabel,
  name,
  location,
  rai,
  pricePerRai,
  totalPrice,
  href,
  className,
}: PlotCardProps) {
  const mapHref = href ?? routes.dashboardExplore;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-[16px] bg-white p-4",
        "shadow-[0_5px_18px_rgba(0,31,84,0.08)]",
        className,
      )}
    >
      {/* Thumbnail */}
      <div className="relative h-[58px] w-[58px] shrink-0 overflow-hidden rounded-[10px]">
        <Image
          src={imageSrc}
          alt={name}
          fill
          sizes="58px"
          className="object-cover"
        />
      </div>

      {/* Details */}
      <div className="min-w-0 flex-1">
        {regionLabel && (
          <p className="font-[family-name:var(--font-manrope)] text-[11px] font-semibold uppercase tracking-[0.06em] text-[#c9a227]">
            {regionLabel}
          </p>
        )}
        <h3 className="truncate font-[family-name:var(--font-manrope)] text-[14px] font-semibold leading-[19px] text-[#111111]">
          {name}
        </h3>
        <p className="mt-0.5 font-[family-name:var(--font-manrope)] text-[12px] text-[#818d97]">
          ◉ {location}
        </p>
        <p className="mt-1 font-[family-name:var(--font-manrope)] text-[12px] text-[#e00c1b]">
          {rai} Rai{" "}
          <span className="text-[#818d97]">
            · ${pricePerRai.toFixed(2)} / Rai
          </span>
        </p>
      </div>

      {/* Price + link */}
      <div className="shrink-0 text-right">
        <strong className="block font-[family-name:var(--font-manrope)] text-[20px] font-semibold text-[#111111]">
          ${totalPrice.toFixed(2)}
        </strong>
        <Link
          href={mapHref}
          className="mt-1 block font-[family-name:var(--font-manrope)] text-[12px] font-medium text-[#001f54] hover:underline"
        >
          View Map →
        </Link>
      </div>
    </div>
  );
}
