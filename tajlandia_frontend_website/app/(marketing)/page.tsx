import type { Metadata } from "next";
import { HomePage } from "@/modules/home";
import { createPageMetadata } from "@/lib/seo/metadata";
import { brand } from "@/lib/constants/brand";
import { routes } from "@/lib/constants/routes";

export const metadata: Metadata = createPageMetadata({
  title: brand.tagline,
  description: brand.description,
  path: routes.home,
});

export default function Page() {
  return <HomePage />;
}
