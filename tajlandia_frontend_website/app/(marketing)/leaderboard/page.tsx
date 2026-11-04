import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/metadata";
import { routes } from "@/lib/constants/routes";
import { PublicLeaderboardPage, fetchPublicLeaderboard } from "@/modules/dashboard";

export const metadata: Metadata = createPageMetadata({
  title: "Leaderboard",
  description: "The collectors who own the largest pieces of Thailand.",
  path: routes.publicLeaderboard,
});

export default async function LeaderboardRoutePage() {
  return <PublicLeaderboardPage entries={await fetchPublicLeaderboard()} />;
}
