import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/ComingSoon";
import { createPageMetadata } from "@/lib/seo/metadata";
import { routes } from "@/lib/constants/routes";

export const metadata: Metadata = createPageMetadata({
  title: "Terms of Use",
  description: "Terms of use will be published here.",
  path: routes.terms,
  index: false,
});

export default function TermsPage() {
  return (
    <ComingSoon
      title="Terms of Use"
      description="This legal page is a route placeholder until content is provided."
    />
  );
}
