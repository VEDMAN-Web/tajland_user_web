"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { localizeHref, splitLocalePath, type Locale } from "@/lib/i18n/locale";
import { chromeMessages } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils/cn";

type LanguageSwitcherProps = {
  locale: Locale;
  className?: string;
};

const order: Locale[] = ["en", "pl"];

/** Crawlable EN | PL links to the same page in the other language. */
export function LanguageSwitcher({ locale, className }: LanguageSwitcherProps) {
  const pathname = usePathname() ?? "/";
  const { path } = splitLocalePath(pathname);
  const messages = chromeMessages[locale];

  return (
    <nav
      aria-label={messages.languageSwitchLabel}
      className={cn("flex items-center gap-1 text-[13px] font-semibold", className)}
    >
      {order.map((code, index) => (
        <span key={code} className="flex items-center gap-1">
          {index > 0 ? <span aria-hidden="true" className="text-[#b6bfce]">/</span> : null}
          {code === locale ? (
            <span aria-current="true" className="px-1 text-navy">
              {code.toUpperCase()}
            </span>
          ) : (
            <Link
              href={localizeHref(code, path)}
              hrefLang={code}
              lang={code}
              prefetch={false}
              title={messages.languages[code]}
              className="px-1 text-[#5B6B86] transition-colors hover:text-navy"
            >
              {code.toUpperCase()}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
