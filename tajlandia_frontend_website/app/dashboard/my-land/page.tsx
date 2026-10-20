import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/metadata";
import { MyLandPage } from "@/modules/dashboard";

export const metadata: Metadata = createPageMetadata({
  title: "My Land",
  description: "View the land you own across Thailand.",
  path: "/dashboard/my-land",
  index: false,
});

export default function DashboardMyLandPage() {
  return <MyLandPage />;
}
