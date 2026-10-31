import "server-only";

import { apiGet } from "@/lib/api/client";
import { apiEnvelope } from "@/lib/api/envelope";
import { leaderboardSchema, type LeaderboardEntry } from "../schemas/leaderboard.schema";

// The ranking changes only when an order is paid; a short cache keeps the public page fast.
const PUBLIC_LEADERBOARD_REVALIDATE_SECONDS = 60;

/**
 * Top 10 buyers for the public site (`GET /leaderboard/public`, no token), or null when the
 * API fails so the page can show its own error instead of breaking.
 */
export async function fetchPublicLeaderboard(): Promise<LeaderboardEntry[] | null> {
  try {
    const response = await apiGet("/leaderboard/public", apiEnvelope(leaderboardSchema), {
      revalidate: PUBLIC_LEADERBOARD_REVALIDATE_SECONDS,
      timeoutMs: 15_000,
    });
    return response.data;
  } catch {
    return null;
  }
}
