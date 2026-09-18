import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/metadata";
import { ProfilePage } from "@/modules/dashboard";

export const metadata: Metadata = createPageMetadata({
  title: "Profile",
  description: "Manage your Tajlandia profile and account.",
  path: "/dashboard/profile",
  index: false,
});

export default function DashboardProfileRoutePage() {
  return <ProfilePage />;
}
