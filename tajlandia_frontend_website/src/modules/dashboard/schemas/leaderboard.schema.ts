import { z } from "zod";

// `GET /leaderboard` `data`: top 10 buyers by paid order total, rank 1 first.
// Empty when nobody has paid yet.
const leaderboardEntrySchema = z.object({
  rank: z.number().int().positive(),
  userId: z.string().min(1),
  firstName: z.string().nullish(),
  lastName: z.string().nullish(),
  // Absolute URL on the backend host (".../uploads/userProfile/x.jpg"), or "" when unset.
  profileImage: z.string().nullish(),
  totalPrice: z.number().nonnegative(),
  totalSizeRai: z.number().nonnegative(),
  totalPlots: z.number().int().nonnegative(),
});

export const leaderboardSchema = z.array(leaderboardEntrySchema);

export type LeaderboardEntry = z.infer<typeof leaderboardEntrySchema>;

// One card per purchased plot, newest purchase first.
const leaderboardPlotSchema = z.object({
  plotId: z.string().min(1),
  plotCode: z.string(),
  plotName: z.string().nullish(),
  image: z.string().nullish(),
  // Zone type: "ICON", "POPULAR" or "STANDARD".
  tier: z.string(),
  city: z.string().nullish(),
  province: z.string().nullish(),
  zone: z.string().nullish(),
  sizeRai: z.number().nonnegative(),
  price: z.number().nonnegative(),
  latitude: z.number().nullish(),
  longitude: z.number().nullish(),
  certificateNo: z.string().nullish(),
  certificateUrl: z.string().nullish(),
});

// `GET /leaderboard/{userId}` `data`. Zero totals and no plots when the user
// hasn't paid for anything; `rank` is null then.
export const leaderboardProfileSchema = z.object({
  user: z.object({
    userId: z.string().min(1),
    firstName: z.string().nullish(),
    lastName: z.string().nullish(),
    profileImage: z.string().nullish(),
    memberSince: z.number().int().nullish(),
    rank: z.number().int().positive().nullable(),
  }),
  overview: z.object({
    totalPrice: z.number().nonnegative(),
    totalSizeRai: z.number().nonnegative(),
    totalPlots: z.number().int().nonnegative(),
  }),
  plots: z.array(leaderboardPlotSchema),
});

export type LeaderboardProfile = z.infer<typeof leaderboardProfileSchema>;
export type LeaderboardPlot = z.infer<typeof leaderboardPlotSchema>;
