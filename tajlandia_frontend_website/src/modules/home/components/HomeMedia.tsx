import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import type { HomeMediaAsset } from "../types/home.types";

type HomeMediaProps = {
  image?: HomeMediaAsset;
  className?: string;
  sizes?: string;
  priority?: boolean;
  fill?: boolean;
};

export function HomeMedia({
  image,
  className,
  sizes,
  priority = false,
  fill = false,
}: HomeMediaProps) {
  if (!image) {
    return null;
  }

  if (fill) {
    return (
      <Image
        src={image.src}
        alt={image.alt}
        fill
        priority={priority}
        sizes={sizes ?? "100vw"}
        className={cn("h-full w-full max-w-none object-cover", className)}
      />
    );
  }

  return (
    <Image
      src={image.src}
      alt={image.alt}
      width={image.width}
      height={image.height}
      priority={priority}
      sizes={sizes}
      className={className}
    />
  );
}
