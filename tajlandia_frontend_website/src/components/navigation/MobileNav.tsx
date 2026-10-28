"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { getMainNavigation } from "@/lib/constants/navigation";
import { localizeHref, splitLocalePath, type Locale } from "@/lib/i18n/locale";
import { chromeMessages } from "@/lib/i18n/messages";
import { routes } from "@/lib/constants/routes";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

export function MobileNav({ locale = "en" }: { locale?: Locale }) {
  const messages = chromeMessages[locale];
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const pathname = splitLocalePath(usePathname() ?? "/").path;

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-navy/15 bg-white/90 text-navy"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="sr-only">{open ? messages.closeMenu : messages.openMenu}</span>
        {open ? (
          <span aria-hidden="true" className="text-xl leading-none">×</span>
        ) : (
          <span aria-hidden="true" className="flex w-5 flex-col gap-1">
            <span className="h-0.5 w-full rounded-full bg-navy" />
            <span className="h-0.5 w-full rounded-full bg-navy" />
            <span className="h-0.5 w-full rounded-full bg-navy" />
          </span>
        )}
      </button>

      {open && typeof document !== "undefined" ? createPortal(
        <div
          id={menuId}
          role="dialog"
          aria-modal="true"
          aria-label={messages.mainMenuLabel}
          className="fixed inset-x-0 bottom-0 top-[4.5rem] z-[110] overflow-y-auto bg-white px-6 py-8 sm:top-20"
        >
          <nav className="flex flex-col gap-2">
            {getMainNavigation(locale).map((item) => {
              const isActive = pathname === item.href.split("?")[0];

              return (
                <Link
                  key={item.href}
                  href={localizeHref(locale, item.href)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "group relative inline-block rounded-full px-5 py-4 pb-[18px] text-xl transition-colors duration-200",
                    isActive
                      ? "font-medium text-navy"
                      : "text-[#61728c] hover:text-navy",
                  )}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                  <span
                    className={cn(
                      "absolute bottom-3 left-5 right-5 h-[1.5px] transition-all duration-300",
                      isActive
                        ? "bg-[var(--Theme-2-Logo-Red,#E00C1B)]"
                        : "w-0 scale-x-0 bg-[var(--Theme-2-Logo-Red,#E00C1B)] group-hover:scale-x-100",
                    )}
                    style={isActive ? {} : { transformOrigin: "left" }}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="mt-8 flex flex-col gap-3">
            <Button
              href={routes.signup}
              variant="secondary"
              className="w-full"
              onClick={() => setOpen(false)}
            >
              {messages.signUp}
            </Button>
            <Button href={routes.login} className="w-full" onClick={() => setOpen(false)}>
              {messages.login}
            </Button>
          </div>
        </div>,
        document.body,
      ) : null}
    </div>
  );
}
