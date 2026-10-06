import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/metadata";
import { LeaderboardPage } from "@/modules/dashboard";

export const metadata: Metadata = createPageMetadata({
  title: "Leaderboard",
  description: "See who holds the most land across Thailand.",
  path: "/dashboard/leaderboard",
  index: false,
});

export default function DashboardLeaderboardPage() {
  return <LeaderboardPage />;
}
