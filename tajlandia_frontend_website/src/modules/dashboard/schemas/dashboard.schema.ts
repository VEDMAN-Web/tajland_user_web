import { z } from "zod";

const featuredRegionSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullish(),
  imageUrl: z.string().nullish(),
  locationCount: z.number().int().nonnegative(),
  // e.g. "Featured"; shown as sent.
  badge: z.string().nullish(),
  displayOrder: z.number().optional(),
});

// Real `GET /dashboard` `data`. `verification` isn't used yet (the page keeps
// its fixed "All holdings verified" line), so it isn't validated here.
export const dashboardSchema = z.object({
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    avatarUrl: z.string().nullish(),
  }),
  collection: z.object({
    totalLandSqFt: z.number().nonnegative(),
    totalLandRai: z.number().nonnegative(),
    plotsClaimed: z.number().int().nonnegative(),
    regionsCount: z.number().int().nonnegative(),
    totalSpent: z.number().nonnegative(),
    currency: z.string(),
  }),
  featuredRegions: z.array(featuredRegionSchema),
  gift: z.object({ enabled: z.boolean() }).nullish(),
});

export type DashboardData = z.infer<typeof dashboardSchema>;
export type FeaturedRegion = z.infer<typeof featuredRegionSchema>;
