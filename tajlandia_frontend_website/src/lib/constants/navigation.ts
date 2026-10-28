import { routes } from "@/lib/constants/routes";
import type { Locale } from "@/lib/i18n/locale";
import { chromeMessages } from "@/lib/i18n/messages";

export const mainNavigation = [
  { href: routes.home, label: "Home" },
  { href: routes.explore, label: "Explore Map" },
  { href: routes.blog, label: "Blog" },
  { href: routes.contact, label: "Get in Touch" },
] as const;

export const footerNavigation = {
  explore: [
    { href: routes.explore, label: "Explore Map" },
    { href: routes.blog, label: "Blog" },
    { href: routes.contact, label: "Get in Touch" },
  ],
  help: [
    { href: routes.contact, label: "Get in Touch" },
    { href: routes.login, label: "Login" },
    { href: routes.signup, label: "Sign Up" },
  ],
  resources: [
    { href: routes.privacy, label: "Privacy Policy" },
    { href: routes.terms, label: "Terms of Use" },
  ],
} as const;

export function getMainNavigation(locale: Locale) {
  const nav = chromeMessages[locale].nav;
  return [
    { href: routes.home, label: nav.home },
    { href: routes.explore, label: nav.explore },
    { href: routes.blog, label: nav.blog },
    { href: routes.contact, label: nav.contact },
  ] as const;
}
