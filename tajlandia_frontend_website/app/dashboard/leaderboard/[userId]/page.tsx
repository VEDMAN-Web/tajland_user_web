import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/metadata";
import { LeaderboardOwnerPage } from "@/modules/dashboard";

export const metadata: Metadata = createPageMetadata({
  title: "Owner Profile",
  description: "View a top owner's land collection on the Tajlandia leaderboard.",
  path: "/dashboard/leaderboard",
  index: false,
});

export default async function LeaderboardOwnerRoute({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  return <LeaderboardOwnerPage userId={userId} />;
}
