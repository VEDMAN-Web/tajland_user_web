"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { routes } from "@/lib/constants/routes";

type DashboardNavbarProps = {
  active: "home" | "explore" | "my-land";
  overlay?: boolean;
};

function Icon({ children }: { children: React.ReactNode }) {
  return <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-navy shadow-[0_5px_20px_rgba(11,31,77,0.08)]">{children}</span>;
}

export function DashboardNavbar({ active, overlay = false }: DashboardNavbarProps) {
  const [language, setLanguage] = useState<"EN" | "PL">("EN");
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const activeClass = "bg-navy text-white";
  const navClass = overlay ? "absolute inset-x-0 top-0 z-20" : "sticky top-0 z-50";

  return (
    <header className={`${navClass} bg-transparent pt-6`}>
      <div className="mx-auto flex h-[54px] w-[92%] max-w-none items-center justify-between px-5 sm:px-8">
        <BrandLogo compact href={routes.dashboard} />
        <div className="flex items-center gap-3">
          <nav className="hidden h-10 items-center gap-1 rounded-full bg-white p-1 shadow-[0_5px_20px_rgba(11,31,77,0.1)] sm:flex">
            <Link href={routes.dashboard} className={`inline-flex h-8 items-center rounded-full px-4 text-[14px] font-medium ${active === "home" ? activeClass : "hover:bg-[#f5f7fa]"}`} style={{ fontFamily: "var(--font-manrope)" }}>Home</Link>
            <Link href="/dashboard/explore" className={`inline-flex h-8 items-center rounded-full px-4 text-[14px] font-medium ${active === "explore" ? activeClass : "hover:bg-[#f5f7fa]"}`} style={{ fontFamily: "var(--font-manrope)" }}>Explore Map</Link>
            <Link href="/dashboard/my-land" className={`inline-flex h-8 items-center rounded-full px-4 text-[14px] font-medium ${active === "my-land" ? activeClass : "hover:bg-[#f5f7fa]"}`} style={{ fontFamily: "var(--font-manrope)" }}>My Land</Link>
          </nav>
          <div className="flex items-center gap-2">
            <div className="relative hidden sm:block">
              <button type="button" aria-expanded={isLanguageOpen} onClick={() => setIsLanguageOpen((open) => !open)} className="flex h-9 min-w-20 items-center justify-center gap-2 rounded-full bg-white px-3 text-[10px] shadow-[0_5px_20px_rgba(11,31,77,0.08)]"><Image src={language === "EN" ? "/images/dashboard/en-flag.svg" : "/images/dashboard/pl-flag.svg"} alt="" width={20} height={14} /> <span className="text-[15px] font-medium" style={{ fontFamily: "'Rethink Sans', sans-serif" }}>{language}</span><span aria-hidden="true" className="ml-1 inline-block h-2 w-2 -translate-y-0.5 rotate-45 border-b-2 border-r-2 border-navy" /></button>
              {isLanguageOpen ? <div className="absolute right-0 top-10 z-20 w-36 rounded-xl bg-white p-1 text-[10px] shadow-[0_8px_24px_rgba(11,31,77,0.14)]"><button type="button" onClick={() => { setLanguage("EN"); setIsLanguageOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-[#f5f7fa]"><Image src="/images/dashboard/en-flag.svg" alt="" width={20} height={14} /> EN — English</button><button type="button" onClick={() => { setLanguage("PL"); setIsLanguageOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-[#f5f7fa]"><Image src="/images/dashboard/pl-flag.svg" alt="" width={20} height={14} /> PL — Polish</button></div> : null}
            </div>
            <button type="button" aria-label="Cart"><Icon><Image src="/images/dashboard/cart.png" alt="" width={28} height={24} /></Icon></button>
            <Link href={routes.profile} aria-label="Profile"><Icon><Image src="/images/dashboard/profile.png" alt="" width={22} height={22} /></Icon></Link>
          </div>
        </div>
      </div>
    </header>
  );
}
