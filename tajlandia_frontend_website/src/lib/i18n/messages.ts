import type { Locale } from "./locale";

/** Site chrome (header, footer, skip link) in each public locale. */
export type ChromeMessages = {
  skipToContent: string;
  primaryNavLabel: string;
  mainMenuLabel: string;
  openMenu: string;
  closeMenu: string;
  homeLinkLabel: string;
  signUp: string;
  login: string;
  nav: { home: string; explore: string; blog: string; contact: string };
  languageSwitchLabel: string;
  languages: { en: string; pl: string };
  footer: {
    tagline: [string, string];
    companyHeading: string;
    journal: string;
    map: string;
    certificate: string;
    faq: string;
    contact: string;
    legalHeading: string;
    privacy: string;
    terms: string;
    riskDisclosure: string;
    cookiePolicy: string;
    contactHeading: string;
  };
};

export const chromeMessages: Record<Locale, ChromeMessages> = {
  en: {
    skipToContent: "Skip to content",
    primaryNavLabel: "Primary",
    mainMenuLabel: "Main menu",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    homeLinkLabel: "Tajlandia home",
    signUp: "Sign Up",
    login: "Login",
    nav: { home: "Home", explore: "Explore Map", blog: "Blog", contact: "Get in Touch" },
    languageSwitchLabel: "Language",
    languages: { en: "English", pl: "Polski" },
    footer: {
      tagline: [
        "A symbolic map of Thailand. Choose a fragment, claim",
        "your certificate, make it part of your story.",
      ],
      companyHeading: "Company",
      journal: "Journal",
      map: "Map",
      certificate: "Certificate",
      faq: "FAQ",
      contact: "Contact",
      legalHeading: "Legal",
      privacy: "Privacy Policy",
      terms: "Terms and Conditions",
      riskDisclosure: "Risk Disclosure",
      cookiePolicy: "Cookie Policy",
      contactHeading: "Contact us",
    },
  },
  pl: {
    skipToContent: "Przejdź do treści",
    primaryNavLabel: "Główna nawigacja",
    mainMenuLabel: "Menu główne",
    openMenu: "Otwórz menu",
    closeMenu: "Zamknij menu",
    homeLinkLabel: "Tajlandia – strona główna",
    signUp: "Zarejestruj się",
    login: "Zaloguj się",
    nav: { home: "Strona główna", explore: "Mapa", blog: "Blog", contact: "Kontakt" },
    languageSwitchLabel: "Język",
    languages: { en: "English", pl: "Polski" },
    footer: {
      tagline: [
        "Symboliczna mapa Tajlandii. Wybierz fragment,",
        "odbierz certyfikat i uczyń go częścią swojej historii.",
      ],
      companyHeading: "Firma",
      journal: "Dziennik",
      map: "Mapa",
      certificate: "Certyfikat",
      faq: "FAQ",
      contact: "Kontakt",
      legalHeading: "Informacje prawne",
      privacy: "Polityka prywatności",
      terms: "Regulamin",
      riskDisclosure: "Informacja o ryzyku",
      cookiePolicy: "Polityka cookies",
      contactHeading: "Skontaktuj się z nami",
    },
  },
};

/** Tagline and description used in page titles, search snippets and share cards. */
export const siteCopy: Record<Locale, { tagline: string; description: string }> = {
  en: {
    tagline: "Claim your little piece of Thailand.",
    description:
      "Explore Thailand through an interactive map, choose your plots and create your own digital collection.",
  },
  pl: {
    tagline: "Zdobądź swój kawałek Tajlandii.",
    description:
      "Odkrywaj Tajlandię na interaktywnej mapie, wybieraj symboliczne działki i twórz własną kolekcję cyfrową.",
  },
};
