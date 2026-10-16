import Image from "next/image";
import { isAllowedRemoteImage } from "@/lib/config/remote-images";

type BlogCoverImageProps = {
  src: string | null | undefined;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
};

// `next/image` only accepts hosts from `remote-images.ts`; anything else (or no
// image) leaves the grey placeholder the card frame already paints.
export function BlogCoverImage({
  src,
  alt,
  sizes,
  priority,
  className,
}: BlogCoverImageProps) {
  if (!isAllowedRemoteImage(src)) return null;

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={className}
    />
  );
}
