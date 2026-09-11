import { connection } from "next/server";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

export default async function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await connection();

  return (
    <>
      <a
        href="#main-content"
        className="pointer-events-none fixed left-4 top-4 z-[100] -translate-y-16 rounded-full bg-navy px-4 py-2 text-sm text-white opacity-0 transition-none focus:pointer-events-auto focus:translate-y-0 focus:opacity-100 focus-visible:pointer-events-auto focus-visible:translate-y-0 focus-visible:opacity-100"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main
        id="main-content"
        className="flex flex-1 flex-col overflow-x-clip"
        tabIndex={-1}
      >
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
