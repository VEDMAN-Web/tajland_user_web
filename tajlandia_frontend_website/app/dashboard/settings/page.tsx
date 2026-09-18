import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/metadata";
import { SettingsPage } from "@/modules/dashboard";

export const metadata: Metadata = createPageMetadata({
  title: "Settings",
  description: "Manage your Tajlandia account settings.",
  path: "/dashboard/settings",
  index: false,
});

export default function DashboardSettingsRoutePage() {
  return <SettingsPage />;
}
