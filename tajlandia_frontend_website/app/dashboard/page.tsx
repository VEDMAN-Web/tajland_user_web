import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/metadata";
import { DashboardPage } from "@/modules/dashboard";

export const metadata: Metadata = createPageMetadata({
  title: "Dashboard",
  description: "Your Tajlandia dashboard. Manage your land collection and explore Thailand.",
  path: "/dashboard",
  index: false,
});

export default function DashboardRoutePage() {
  return <DashboardPage />;
}
