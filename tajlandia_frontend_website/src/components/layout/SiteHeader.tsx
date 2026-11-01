import { BrandLogo } from "@/components/ui/BrandLogo";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { MainNav } from "@/components/navigation/MainNav";
import { MobileNav } from "@/components/navigation/MobileNav";
import { LanguageSwitcher } from "@/components/navigation/LanguageSwitcher";
import { routes } from "@/lib/constants/routes";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { chromeMessages } from "@/lib/i18n/messages";

export function SiteHeader({ locale = "en" }: { locale?: Locale }) {
  const messages = chromeMessages[locale];
  return (
    // `site-header*` classes are styling hooks: pages with a full-screen hero
    // (see .hero-film in globals.css) restyle the header without coupling to it.
    <header className="site-header sticky top-0 z-40 w-full border-b border-line/80 bg-white/95 backdrop-blur-md">
      <Container className="grid h-[4.5rem] grid-cols-[auto_1fr_auto] items-center gap-3 sm:h-20 lg:grid-cols-[1fr_auto_1fr] lg:gap-6">
        <BrandLogo className="site-header-brand" href={localizeHref(locale, routes.home)} label={messages.homeLinkLabel} />
        <MainNav className="site-header-nav" locale={locale} />
        <div className="flex items-center justify-end gap-2 sm:gap-3">
          <LanguageSwitcher locale={locale} className="site-header-lang" />
          <Button
            href={routes.signup}
            variant="inverse"
            size="sm"
            className="site-header-action hidden shadow-[0_8px_24px_rgba(11,31,77,0.12)] lg:inline-flex"
          >
            {messages.signUp}
          </Button>
          <Button href={routes.login} variant="inverse" size="sm" className="site-header-action hidden shadow-[0_8px_24px_rgba(11,31,77,0.12)] lg:inline-flex">
            {messages.login}
          </Button>
          <MobileNav locale={locale} />
        </div>
      </Container>
    </header>
  );
}
