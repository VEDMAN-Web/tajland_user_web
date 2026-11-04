import type { Metadata } from "next";
import { Suspense } from "react";
import { createPageMetadata } from "@/lib/seo/metadata";
import { CheckoutPage } from "@/modules/dashboard";

export const metadata: Metadata = createPageMetadata({
  title: "Checkout",
  description: "Complete your Tajlandia purchase.",
  path: "/dashboard/checkout",
  index: false,
});

export default function DashboardCheckoutPage() {
  // `useSearchParams` (the applied coupon) needs a Suspense boundary.
  return (
    <Suspense fallback={null}>
      <CheckoutPage />
    </Suspense>
  );
}
