export const brand = {
  name: "Tajlandia",
  tagline: "Claim your little piece of Thailand.",
  description:
    "Explore Thailand through an interactive map, choose your plots and create your own digital collection.",
  // Tajlandia.pl logo package (2026): navy wordmark, red elephant and ".pl". The slogan stays Polish in every version.
  // Compact placements use the no-tagline versions, where the slogan would be too small to read.
  logo: {
    src: "/images/brand/tajlandia-logo.svg",
    alt: "tajlandia.pl",
    width: 1280,
    height: 235,
  },
  // White wordmark for dark backgrounds (navy type on navy is not allowed by the guidelines).
  logoReverse: {
    src: "/images/brand/tajlandia-logo-reverse.svg",
    width: 1280,
    height: 235,
  },
  // Full horizontal logo with the Polish slogan (primary logo in the guidelines); used where it is large enough to read.
  logoTagline: {
    src: "/images/brand/tajlandia-logo-tagline.svg",
    reverseSrc: "/images/brand/tajlandia-logo-reverse-tagline.svg",
    width: 1280,
    height: 285,
  },
  logoStacked: {
    src: "/images/brand/tajlandia-logo-stacked.svg",
    png: "/images/brand/tajlandia-logo-stacked.png",
    taglineSrc: "/images/brand/tajlandia-logo-stacked-tagline.svg",
    taglineWidth: 820,
    taglineHeight: 640,
    width: 820,
    height: 565,
  },
  icon: {
    src: "/images/brand/tajlandia-icon.svg",
    width: 260,
    height: 250,
  },
} as const;
