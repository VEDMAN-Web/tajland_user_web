"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getMainNavigation } from "@/lib/constants/navigation";
import { localizeHref, splitLocalePath, type Locale } from "@/lib/i18n/locale";
import { chromeMessages } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils/cn";

type MainNavProps = {
  className?: string;
  locale?: Locale;
};

export function MainNav({ className, locale = "en" }: MainNavProps) {
  const pathname = splitLocalePath(usePathname() ?? "/").path;

  return (
    <nav
      aria-label={chromeMessages[locale].primaryNavLabel}
      className={cn("hidden items-center gap-6 lg:flex xl:gap-10", className)}
    >
      {getMainNavigation(locale).map((item) => {
        const isActive = pathname === item.href.split("?")[0];

        return (
          <Link
            key={item.href}
            href={localizeHref(locale, item.href)}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "group relative inline-block pb-[3px] text-[15px] font-medium transition-colors duration-200",
              isActive ? "text-navy" : "text-[#5B6B86] hover:text-navy",
            )}
          >
            {item.label}
            <span
              className={cn(
                "absolute bottom-0 left-0 h-[1.5px] transition-all duration-300",
                isActive
                  ? "w-full bg-[var(--Theme-2-Logo-Red,#E00C1B)]"
                  : "w-0 bg-[var(--Theme-2-Logo-Red,#E00C1B)] group-hover:w-full",
              )}
            />
          </Link>
        );
      })}
    </nav>
  );
}
