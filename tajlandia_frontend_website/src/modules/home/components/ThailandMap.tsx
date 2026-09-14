import Image from "next/image";
import type { HomePageContent } from "../types/home.types";

type ThailandMapProps = {
  pins: HomePageContent["map"]["pins"];
};

export function ThailandMap({ pins }: ThailandMapProps) {
  void pins;

  return (
    <Image
      src="/images/home/map.png"
      alt="Map of Thailand and surrounding destinations"
      width={1217}
      height={580}
      sizes="(max-width: 1280px) 100vw, 1217px"
      className="block h-auto w-full"
      priority
    />
  );
}
