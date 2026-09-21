import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/metadata";
import { OrderDetailsPage } from "@/modules/dashboard";

export const metadata: Metadata = createPageMetadata({
  title: "Order Details",
  description: "View your Tajlandia order details.",
  path: "/dashboard/purchases",
  index: false,
});

export default async function OrderDetailsRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OrderDetailsPage orderId={decodeURIComponent(id)} />;
}
