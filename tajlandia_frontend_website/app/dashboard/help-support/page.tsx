import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoader } from "@/components/ui/PageLoader";
import { createPageMetadata } from "@/lib/seo/metadata";
import { HelpSupportPage } from "@/modules/dashboard";

export const metadata: Metadata = createPageMetadata({
  title: "Help & Support",
  description: "Get help with your Tajlandia account and collections.",
  path: "/dashboard/help-support",
  index: false,
});

export default function DashboardHelpSupportRoutePage() {
  // useSearchParams (the ?ticket= link from a notification) needs a Suspense boundary.
  return (
    <Suspense fallback={<PageLoader label="Loading..." />}>
      <HelpSupportPage />
    </Suspense>
  );
}
