import { routes } from "@/lib/constants/routes";
import type { HomePageContent } from "../types/home.types";
import { homePageContent as en } from "./home.mock";

/**
 * Polish home page. Media, ids, ordering and links come from the English
 * content; only text is replaced. Wording avoids "ownership" and "real
 * estate" on purpose: the certificates are symbolic (see the SEO plan).
 * Have a native speaker and counsel review before launch.
 */
export const homePageContentPl: HomePageContent = {
  ...en,
  hero: {
    ...en.hero,
    title: "Zdobądź swój",
    titleContinue: "mały kawałek",
    titleAccent: "Tajlandii.",
    subtitle:
      "Odkrywaj Tajlandię na interaktywnej mapie, wybieraj działki i twórz własną cyfrową kolekcję. Zacznij budować swoje cyfrowe dziedzictwo już dziś.",
    cta: { label: "Odkryj mapę →", href: routes.explore },
    image: en.hero.image && { ...en.hero.image, alt: "Tajskie świątynie pod czystym, błękitnym niebem" },
    film: en.hero.film && {
      ...en.hero.film,
      poster: {
        ...en.hero.film.poster,
        alt: "Widok z lotu ptaka przez chmury na tropikalne wybrzeże i zatokę",
      },
    },
    story: [
      {
        ...en.hero.story![0]!,
        eyebrow: "01 — Odkrywaj",
        title: "Z wysokości chmur",
        titleAccent: "znajdź swoją działkę.",
        body: "Przeglądaj interaktywną mapę i wypatrz fragment ziemi, który do Ciebie przemawia.",
      },
      {
        ...en.hero.story![1]!,
        eyebrow: "02 — Twórz",
        title: "Zobacz, jak Twoja kolekcja",
        titleAccent: "nabiera kształtu.",
        body: "Wybieraj działki, dodawaj je do kolekcji i patrz, jak rośnie Twój cyfrowy zbiór.",
      },
      {
        ...en.hero.story![2]!,
        eyebrow: "03 — Zachowaj",
        title: "Cyfrowa pamiątka,",
        titleAccent: "na zawsze Twoja.",
        body: "Do każdej działki dołączony jest certyfikat autentyczności, który możesz zachować, udostępnić lub podarować.",
        cta: { label: "Odkryj mapę →", href: routes.explore },
      },
    ],
  },
  features: {
    ...en.features,
    heading: "Co chcesz zrobić?",
    subtitle:
      "To Twój kawałek Tajlandii. Wyjątkowe połączenie cyfrowej sztuki i kolekcjonerskiej pasji.",
    items: [
      {
        ...en.features.items[0]!,
        title: "Mapa",
        description:
          "Poznaj piękną, responsywną cyfrową makietę geografii Tajlandii.",
      },
      {
        ...en.features.items[1]!,
        title: "Moje zakupy",
        description:
          "Zdobądź unikalny cyfrowy element kolekcji, zweryfikowany i zapisany na zawsze.",
      },
      {
        ...en.features.items[2]!,
        title: "Podaruj działkę",
        description:
          "Podaruj fragment swojej tajlandzkiej kolekcji komuś wyjątkowemu i stwórz niezapomniane wspomnienie.",
      },
    ],
  },
  world: {
    ...en.world,
    alt: "Ziemia widziana z kosmosu, otoczona świecącą niebieską atmosferą",
    image: en.world.image && {
      ...en.world.image,
      alt: "Ziemia widziana z kosmosu, otoczona świecącą niebieską atmosferą",
    },
  },
  map: {
    ...en.map,
    headingBefore: "Nowy sposób na poznawanie",
    headingAccent: "Tajlandii",
    description: "Odkrywaj mapę, znajdź miejsce, które do Ciebie przemawia, i uczyń jego historię swoją.",
    cta: { label: "Odkryj mapę", href: routes.explore },
  },
  howItWorks: {
    ...en.howItWorks,
    heading: "Jak to działa",
    steps: [
      {
        ...en.howItWorks.steps[0]!,
        title: "Przeglądaj mapę",
        description: "Przeglądaj dostępne sektory w najbardziej atrakcyjnych miejscach Tajlandii.",
      },
      {
        ...en.howItWorks.steps[1]!,
        title: "Wybierz swoją działkę",
        description: "Wskaż dokładną cyfrową współrzędną, która do Ciebie przemawia.",
      },
      {
        ...en.howItWorks.steps[2]!,
        title: "Sfinalizuj zakup",
        description: "Dokończ transakcję, aby zarezerwować swój unikalny cyfrowy element kolekcji.",
      },
      {
        ...en.howItWorks.steps[3]!,
        title: "Odbierz certyfikat",
        description: "Pobierz swój cyfrowy certyfikat autentyczności.",
      },
    ],
  },
  testimonials: {
    ...en.testimonials,
    eyebrow: "Twoja",
    headingBefore: "Coś wartego",
    headingAccent: "zachowania",
    items: en.testimonials.items.map((item) => ({
      ...item,
      quote: "Cyfrowa pamiątka wystawiana w chwili, gdy zdobywasz swój fragment.",
      role: "Kupująca, Wielka Brytania",
      image: item.image && { ...item.image, alt: "Certyfikat symbolicznej działki Tajlandia" },
    })),
    rating: en.testimonials.rating && {
      label: "Wysoko oceniane",
      score: en.testimonials.rating.score,
      detail: "Na podstawie opinii pierwszych odkrywców",
    },
  },
  cta: {
    ...en.cta,
    title: "Twój kawałek Tajlandii",
    subtitle: "Dołącz do listy priorytetowej. Powiadomimy Cię, gdy mapa zostanie otwarta.",
    cta: { label: "Odkryj Tajlandię →", href: routes.explore },
    image: en.cta.image && { ...en.cta.image, alt: "Panorama Bangkoku o zmierzchu nad rzeką" },
  },
};
