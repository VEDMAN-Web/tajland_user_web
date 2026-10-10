import { authedGet } from "@/lib/api/browser-client";
import {
  leaderboardProfileSchema,
  leaderboardSchema,
  type LeaderboardEntry,
  type LeaderboardProfile,
} from "../schemas/leaderboard.schema";

/** Top 10 buyers ranked by total paid amount, then total Rai. */
export function getLeaderboard(signal?: AbortSignal): Promise<LeaderboardEntry[]> {
  return authedGet("/leaderboard", leaderboardSchema, { signal });
}

/**
 * One buyer's profile, totals and purchased plots. 400 for a malformed id,
 * 404 when the user doesn't exist.
 */
export function getLeaderboardProfile(
  userId: string,
  signal?: AbortSignal,
): Promise<LeaderboardProfile> {
  return authedGet(`/leaderboard/${encodeURIComponent(userId)}`, leaderboardProfileSchema, { signal });
}
