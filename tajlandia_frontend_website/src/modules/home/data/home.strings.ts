import type { Locale } from "@/lib/i18n/locale";

/** Small pieces of home-page copy that sit in components rather than in the content object. */
export type HomeStrings = {
  scrollHint: string;
  getInTouch: string;
  ctaTagline: string;
  ctaNoSpam: string;
  howItWorksSubtitle: [string, string];
  stepLabels: [string, string, string, string];
  mapEyebrow: [string, string];
  keepsakeAccent: string;
  mapAria: string;
  mapDescription: string;
  legend: { claimed: string; available: string; restricted: string };
};

export const homeStrings: Record<Locale, HomeStrings> = {
  en: {
    scrollHint: "Scroll",
    getInTouch: "Get In Touch",
    ctaTagline: "Thailand is waiting.",
    ctaNoSpam: "No spam. Just important news and good news.",
    stepLabels: ["EXPLORE", "CHOOSE", "CLAIM", "CERTIFICATE"],
    howItWorksSubtitle: [
      "A seamless process to acquire and showcase",
      "your digital collectible.",
    ],
    mapEyebrow: ["What you", "Receive"],
    keepsakeAccent: "Keepsake",
    mapAria: "Interactive Thailand map",
    mapDescription:
      "Explore the map, discover a place that resonates with you, and claim its story as your own.",
    legend: { claimed: "Claimed", available: "Available", restricted: "Restricted" },
  },
  pl: {
    scrollHint: "Przewiń",
    getInTouch: "Skontaktuj się",
    ctaTagline: "Tajlandia czeka.",
    ctaNoSpam: "Żadnego spamu. Tylko ważne i dobre wiadomości.",
    stepLabels: ["ODKRYJ", "WYBIERZ", "ZDOBĄDŹ", "CERTYFIKAT"],
    howItWorksSubtitle: [
      "Prosty proces, dzięki któremu zdobędziesz i pokażesz",
      "swój cyfrowy element kolekcji.",
    ],
    mapEyebrow: ["Co", "otrzymujesz"],
    keepsakeAccent: "Pamiątka",
    mapAria: "Interaktywna mapa Tajlandii",
    mapDescription:
      "Odkrywaj mapę, znajdź miejsce, które do Ciebie przemawia, i uczyń jego historię swoją.",
    legend: { claimed: "Zdobyte", available: "Dostępne", restricted: "Ograniczone" },
  },
};
