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
              "relative inline-block text-[15px] font-medium transition-all duration-300 hover:text-navy hover:translate-x-1 group",
              isActive
                ? "text-navy"
                : "text-[#5B6B86]",
            )}
          >
            {item.label}
            <span className={cn(
              "absolute bottom-[-5px] left-0 h-0.5 transition-all duration-300",
              isActive
                ? "w-full bg-navy"
                : "w-0 bg-navy group-hover:w-full"
            )} />
          </Link>
        );
      })}
    </nav>
  );
}
