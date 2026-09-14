import Image from "next/image";
import Link from "next/link";
import type { HomeFeatureCard } from "../types/home.types";

type FeatureCardProps = {
  item: HomeFeatureCard;
};

const iconSources = {
  pointer: "/images/home/features/explore-map.png",
  bag: "/images/home/features/purchases.png",
  gift: "/images/home/features/gift-plot.png",
} as const;

export function FeatureCard({ item }: FeatureCardProps) {
  return (
    <Link
      href={item.href}
      className="group flex h-[400px] min-w-0 flex-col rounded-[1.75rem] border border-[#d7e3f4] bg-[#f3f6fb] p-7 text-navy transition-colors duration-300 hover:border-navy hover:bg-navy hover:text-white focus-visible:border-navy focus-visible:bg-navy focus-visible:text-white sm:p-10"
    >
      <span className="inline-flex h-[76px] w-[76px] shrink-0 items-center justify-center transition-transform duration-300 group-hover:scale-105 group-focus-visible:scale-105">
        <Image src={iconSources[item.icon]} alt="" width={128} height={128} className="h-full w-full object-contain" />
      </span>
      <div className="mt-auto">
        <h3 className="text-[24px] font-semibold leading-tight tracking-tight">{item.title}</h3>
        <p className="mt-3 text-[18px] leading-7 text-muted transition-colors duration-300 group-hover:text-white/80 group-focus-visible:text-white/80">
          {item.description}
        </p>
      </div>
    </Link>
  );
}
