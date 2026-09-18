import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/metadata";
import { MyPurchasesPage } from "@/modules/dashboard";

export const metadata: Metadata = createPageMetadata({ title: "My Purchases", description: "View your Tajlandia purchases.", path: "/dashboard/purchases", index: false });

export default function DashboardPurchasesPage() {
  return <MyPurchasesPage />;
}
