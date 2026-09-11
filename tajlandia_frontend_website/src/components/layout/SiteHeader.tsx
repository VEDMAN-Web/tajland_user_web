"use client";

import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { MainNav } from "@/components/navigation/MainNav";
import { MobileNav } from "@/components/navigation/MobileNav";
import { routes } from "@/lib/constants/routes";
import { cn } from "@/lib/utils/cn";

export function SiteHeader() {
  const pathname = usePathname();
  const isHome = pathname === routes.home;

  return (
    <header
      className={cn(
        "z-40 w-full",
        isHome
          ? "absolute inset-x-0 top-0 bg-transparent"
          : "sticky top-0 border-b border-line/80 bg-white/95 backdrop-blur-md",
      )}
    >
      <Container className="grid h-[4.5rem] grid-cols-[auto_1fr_auto] items-center gap-3 sm:h-20 lg:grid-cols-[1fr_auto_1fr] lg:gap-6">
        <BrandLogo />
        <MainNav />
        <div className="flex items-center justify-end gap-2 sm:gap-3">
          <Button
            href={routes.signup}
            variant="inverse"
            size="sm"
            className="hidden shadow-[0_8px_24px_rgba(11,31,77,0.12)] lg:inline-flex"
          >
            Sign Up
          </Button>
          <Button href={routes.login} size="sm" className="hidden lg:inline-flex">
            Login
          </Button>
          <MobileNav />
        </div>
      </Container>
    </header>
  );
}
