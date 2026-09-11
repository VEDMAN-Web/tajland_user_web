import Link from "next/link";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Container } from "@/components/ui/Container";
import { brand } from "@/lib/constants/brand";
import { footerNavigation } from "@/lib/constants/navigation";
import type { AppRoute } from "@/lib/constants/routes";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-line bg-white">
      <Container className="grid gap-10 py-14 md:grid-cols-4">
        <div className="max-w-xs">
          <BrandLogo />
          <p className="mt-4 text-sm leading-6 text-muted">{brand.description}</p>
        </div>
        <FooterColumn title="Explore" links={footerNavigation.explore} />
        <FooterColumn title="Help" links={footerNavigation.help} />
        <FooterColumn title="Legal" links={footerNavigation.resources} />
      </Container>
      <div className="border-t border-line">
        <Container className="flex flex-col gap-2 py-5 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {brand.name}. All rights reserved.
          </p>
          <p>Designed for long-term land and lifestyle discovery in Thailand.</p>
        </Container>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: readonly { href: AppRoute; label: string }[];
}) {
  return (
    <div>
      <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-navy">
        {title}
      </p>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={`${link.href}-${link.label}`}>
            <Link href={link.href} className="text-sm text-muted hover:text-navy">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
