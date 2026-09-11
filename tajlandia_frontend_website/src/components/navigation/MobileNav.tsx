"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { mainNavigation } from "@/lib/constants/navigation";
import { routes } from "@/lib/constants/routes";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const pathname = usePathname();

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
        <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
        <span aria-hidden="true" className="text-lg leading-none">
          {open ? "×" : "☰"}
        </span>
      </button>
      {open ? (
        <div
          id={menuId}
          role="dialog"
          aria-modal="true"
          aria-label="Main menu"
          className="fixed inset-0 z-50 overflow-y-auto bg-white px-6 py-6"
        >
          <div className="mb-8 flex items-center justify-between">
            <p className="font-display text-xl text-navy">Menu</p>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-navy/15 text-navy"
              onClick={() => setOpen(false)}
            >
              <span className="sr-only">Close menu</span>
              <span aria-hidden="true">×</span>
            </button>
          </div>
          <nav className="flex flex-col gap-1">
            {mainNavigation.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "border-b border-line py-3 text-lg",
                    isActive ? "font-semibold text-navy" : "text-navy",
                  )}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
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
              Sign Up
            </Button>
            <Button href={routes.login} className="w-full" onClick={() => setOpen(false)}>
              Login
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
