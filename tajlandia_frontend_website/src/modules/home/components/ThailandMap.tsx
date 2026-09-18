import { MapboxMap } from "@/components/maps/MapboxMap";
import type { HomePageContent } from "../types/home.types";

type ThailandMapProps = {
  pins: HomePageContent["map"]["pins"];
};

export function ThailandMap({ pins }: ThailandMapProps) {
  void pins;

  return (
    <div className="relative h-[clamp(300px,48vw,580px)] min-h-0 w-full overflow-hidden rounded-[1.5rem]">
      <MapboxMap className="h-full min-h-0" initialCenter={[100.5, 14]} initialZoom={5.5} />
      <div className="pointer-events-none absolute right-5 top-5 z-20 flex items-center gap-4 rounded-full bg-white/95 px-4 py-2 text-[10px] text-[#171717] shadow-[0_4px_12px_rgba(11,31,77,0.12)] sm:right-7 sm:top-7">
        <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#e51d2a]" />Claimed</span>
        <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#0b1f4d]" />Available</span>
        <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#a9a9a9]" />Restricted</span>
      </div>
    </div>
  );
}
