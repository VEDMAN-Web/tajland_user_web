"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mainNavigation } from "@/lib/constants/navigation";
import { cn } from "@/lib/utils/cn";

type MainNavProps = {
  className?: string;
};

export function MainNav({ className }: MainNavProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className={cn("hidden items-center gap-6 lg:flex xl:gap-10", className)}
    >
      {mainNavigation.map((item) => {
        const isActive = pathname === item.href.split("?")[0];

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "text-[15px] font-medium transition-colors hover:text-navy",
              isActive
                ? "text-navy underline decoration-navy decoration-1 underline-offset-[10px]"
                : "text-[#5B6B86]",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
