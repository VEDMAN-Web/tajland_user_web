import Image from "next/image";
import Link from "next/link";
import { brand } from "@/lib/constants/brand";
import { routes } from "@/lib/constants/routes";
import { cn } from "@/lib/utils/cn";

const plainClass =
  "h-11 w-auto max-w-[11rem] bg-transparent object-contain object-left sm:h-12 sm:max-w-[12.5rem] lg:h-14 lg:max-w-[15rem]";

// Under 360px the full logo falls back to the no-tagline one; it is kept small so the header row (logo, EN/PL, menu) fits at 320px.
const narrowClass = "h-9 w-auto max-w-[9.5rem] bg-transparent object-contain object-left min-[360px]:hidden";

// Compact sizes are restated at every breakpoint so the larger `sm:`/`lg:` sizes do not win in the sidebar and navbar.
const compactClass = "h-9 max-w-[8rem] sm:h-9 sm:max-w-[9rem] lg:h-9 lg:max-w-[9.5rem]";
// Standalone (not merged with taglineClass), so none of its responsive sizes can leak into the sidebar.
const compactTaglineClass = "h-11 w-auto max-w-[10.5rem] bg-transparent object-contain object-left";
// The slogan only reads at this width, so the tagline logo gets more room than a plain one.
const taglineClass =
  "h-9 w-auto max-w-[9.5rem] bg-transparent object-contain object-left min-[360px]:h-10 min-[360px]:max-w-[10.5rem] min-[400px]:h-12 min-[400px]:max-w-[13rem] sm:h-14 sm:max-w-[16rem] lg:h-12 lg:max-w-[14rem] xl:h-14 xl:max-w-[16rem]";

type BrandLogoProps = {
  className?: string;
  compact?: boolean;
  /** Show the Polish slogan under a compact logo too (only where there is room for it to be legible). */
  tagline?: boolean;
  /** Also render the white wordmark, shown by CSS where the logo sits on a dark background. */
  withReverse?: boolean;
  href?: string;
  /** Accessible name of the home link; defaults to "<brand> home". */
  label?: string;
};

export function BrandLogo({ className, compact = false, tagline = false, withReverse = false, href = routes.home, label }: BrandLogoProps) {
  const sizeClass = compact ? (tagline ? compactTaglineClass : cn(plainClass, compactClass)) : taglineClass;
  const showTagline = tagline || !compact;
  const base = showTagline ? brand.logoTagline : brand.logo;
  // Phones under 360px have no room for a legible slogan, so the full logo falls back to the no-tagline one there.
  const narrowFallback = showTagline && !compact;
  return (
    <Link
      href={href}
      className={cn("inline-flex shrink-0 items-center", className)}
      aria-label={label ?? `${brand.name} home`}
    >
      {narrowFallback ? (
        <Image
          src={brand.logo.src}
          alt=""
          width={brand.logo.width}
          height={brand.logo.height}
          priority
          className={cn(narrowClass)}
        />
      ) : null}
      <Image
        src={base.src}
        alt=""
        width={base.width}
        height={base.height}
        priority
        className={cn(sizeClass, narrowFallback && "hidden min-[360px]:block", withReverse && "brand-logo-color")}
      />
      {withReverse && showTagline ? (
        <Image
          src={brand.logoTagline.reverseSrc}
          alt=""
          width={brand.logoTagline.width}
          height={brand.logoTagline.height}
          priority
          className={cn(sizeClass, narrowFallback && "hidden min-[360px]:block", "brand-logo-reverse")}
        />
      ) : null}
    </Link>
  );
}
