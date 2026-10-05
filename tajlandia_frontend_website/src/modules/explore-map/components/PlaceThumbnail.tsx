"use client";

import Image from "next/image";
import { useState } from "react";
import { isAllowedRemoteImage } from "@/lib/config/remote-images";
import { cn } from "@/lib/utils/cn";

const PLACEHOLDER_SRC = "/images/explore/place-placeholder.svg";

/**
 * Place image for search rows. Falls back to the local placeholder when the
 * URL is missing, from a host we don't allow, or fails to load.
 */
export function PlaceThumbnail({
  src,
  size = 34,
  className = "h-[34px] w-[34px] rounded-[7px]",
}: {
  src: string | null | undefined;
  /** Intrinsic size for next/image; pair it with matching classes. */
  size?: number;
  className?: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const usable = isAllowedRemoteImage(src) && failedSrc !== src;

  return (
    <Image
      src={usable ? src : PLACEHOLDER_SRC}
      alt=""
      width={size}
      height={size}
      unoptimized={!usable}
      onError={() => {
        if (usable) setFailedSrc(src);
      }}
      className={cn("shrink-0 object-cover", className)}
    />
  );
}

/** "1 Zone · 4 Plots", or nothing until the backend sends both counts. */
export function PlaceCounts({
  zone,
  plots,
  t,
}: {
  zone: number | null | undefined;
  plots: number | null | undefined;
  t: (source: string) => string;
}) {
  if (zone == null || plots == null) return null;

  return (
    <span className="block text-[10px] text-[#8d97a3]">
      {`${zone} ${t(zone === 1 ? "Zone" : "Zones")} · `}
      {/* Navy while its row is hovered (Figma "Selected"). */}
      <span className="group-hover/place:text-[#001f54] group-focus-visible/place:text-[#001f54]">
        {`${plots} ${t(plots === 1 ? "Plot" : "Plots")}`}
      </span>
    </span>
  );
}
