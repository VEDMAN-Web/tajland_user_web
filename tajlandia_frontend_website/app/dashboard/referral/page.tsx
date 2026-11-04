import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/metadata";
import { routes } from "@/lib/constants/routes";
import { ReferralPage } from "@/modules/dashboard";

export const metadata: Metadata = createPageMetadata({
  title: "Refer & Earn",
  description: "Share your Tajlandia referral link and earn points.",
  path: routes.referral,
  index: false,
});

export default function DashboardReferralRoutePage() {
  return <ReferralPage />;
}
