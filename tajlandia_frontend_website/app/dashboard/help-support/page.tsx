import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/metadata";
import { HelpSupportPage } from "@/modules/dashboard";

export const metadata: Metadata = createPageMetadata({
  title: "Help & Support",
  description: "Get help with your Tajlandia account and collections.",
  path: "/dashboard/help-support",
  index: false,
});

export default function DashboardHelpSupportRoutePage() {
  return <HelpSupportPage />;
}
