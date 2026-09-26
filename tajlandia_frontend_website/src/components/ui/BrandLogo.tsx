import Image from "next/image";
import Link from "next/link";
import { brand } from "@/lib/constants/brand";
import { routes } from "@/lib/constants/routes";
import { cn } from "@/lib/utils/cn";

type BrandLogoProps = {
  className?: string;
  compact?: boolean;
  href?: string;
};

export function BrandLogo({ className, compact = false, href = routes.home }: BrandLogoProps) {
  return (
    <Link
      href={href}
      className={cn("inline-flex shrink-0 items-center", className)}
      aria-label={`${brand.name} home`}
    >
      <Image
        src={brand.logo.src}
        alt=""
        width={brand.logo.width}
        height={brand.logo.height}
        priority
        className={cn(
          "h-11 w-auto max-w-[11rem] bg-transparent object-contain object-left sm:h-12 sm:max-w-[12.5rem] lg:h-14 lg:max-w-[15rem]",
          compact && "h-9 max-w-[8rem]",
        )}
      />
    </Link>
  );
}
