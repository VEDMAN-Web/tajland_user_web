import Image from "next/image";
import type { HomeHowItWorksStep } from "../types/home.types";

const iconSources: Record<HomeHowItWorksStep["icon"], string> = {
  discover: "/images/home/how-it-works/discover.png",
  explore: "/images/home/how-it-works/explore.png",
  connect: "/images/home/how-it-works/claim.png",
  secure: "/images/home/how-it-works/certificate.png",
};

type HowItWorksIconProps = {
  name: HomeHowItWorksStep["icon"];
};

export function HowItWorksIcon({ name }: HowItWorksIconProps) {
  return (
    <Image
      src={iconSources[name]}
      alt=""
      width={128}
      height={128}
      className="h-full w-full object-contain"
    />
  );
}
