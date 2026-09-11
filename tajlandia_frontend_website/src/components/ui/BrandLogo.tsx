import Image from "next/image";
import Link from "next/link";
import { brand } from "@/lib/constants/brand";
import { routes } from "@/lib/constants/routes";
import { cn } from "@/lib/utils/cn";

type BrandLogoProps = {
  className?: string;
  compact?: boolean;
};

export function BrandLogo({ className, compact = false }: BrandLogoProps) {
  return (
    <Link
      href={routes.home}
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
          "h-10 w-auto max-w-[9.5rem] bg-transparent object-contain object-left sm:h-11 sm:max-w-[11rem] lg:h-12 lg:max-w-[13rem]",
          compact && "h-9 max-w-[8rem]",
        )}
      />
    </Link>
  );
}
