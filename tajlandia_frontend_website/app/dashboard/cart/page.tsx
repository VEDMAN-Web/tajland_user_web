import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/metadata";
import { CartPage } from "@/modules/dashboard";

export const metadata: Metadata = createPageMetadata({ title: "Cart", description: "Review your Tajlandia cart.", path: "/dashboard/cart", index: false });

export default function DashboardCartPage() {
  return <CartPage />;
}
