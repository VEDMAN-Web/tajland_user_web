"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearAuth } from "@/lib/api/auth.utils";
import { routes } from "@/lib/constants/routes";

function MenuIcon({ children }: { children: React.ReactNode }) {
  return <span aria-hidden="true" className="flex h-5 w-5 items-center justify-center text-[15px]">{children}</span>;
}

export function AccountMenu({ active }: { active: "profile" | "password" }) {
  const router = useRouter();
  const items = [
    { label: "Profile", icon: "●", href: routes.profile, key: "profile" as const },
    { label: "Change Password", icon: "▣", href: routes.changePassword, key: "password" as const },
    { label: "My Purchases", icon: "♙", href: "/dashboard/my-land" },
    { label: "My Certificates", icon: "▤", href: "/dashboard/my-land" },
    { label: "Settings", icon: "⚙" },
    { label: "Help & Support", icon: "♧", href: routes.contact },
    { label: "Term & Condition", icon: "▧", href: routes.terms },
    { label: "Privacy Policy", icon: "◈", href: routes.privacy },
  ];

  return <aside className="h-fit rounded-[15px] bg-white p-5 shadow-[0_5px_24px_rgba(11,31,77,0.08)]"><p className="px-1 text-[10px] font-medium uppercase tracking-[0.08em] text-[#7b858f]">Account Menu</p><nav className="mt-4 space-y-1">{items.map((item) => { const className = `flex h-10 items-center gap-3 rounded-[9px] px-3 text-[12px] ${item.key === active ? "bg-navy font-medium text-white" : item.href ? "text-[#81909d] hover:bg-[#f3f6f8]" : "text-[#b4bdc5]"}`; return item.href ? <Link key={item.label} href={item.href} className={className}><MenuIcon>{item.icon}</MenuIcon>{item.label}</Link> : <span key={item.label} className={className}><MenuIcon>{item.icon}</MenuIcon>{item.label}</span>; })}</nav><div className="my-3 border-t border-[#e8edf1]" /><button type="button" onClick={() => { clearAuth(); router.replace(routes.home); }} className="flex h-10 w-full items-center gap-3 rounded-[9px] px-3 text-[12px] text-[#ec2633] hover:bg-[#fff3f4]"><MenuIcon>↪</MenuIcon>Logout</button></aside>;
}
