import { z } from "zod";

// Real `GET /referral/dashboard` `data`: the user's code and the totals.
export const referralDashboardSchema = z.object({
  code: z.string(),
  // The backend's own short link (link.tajlandia.com/...); the page shares /signup?ref=CODE instead.
  link: z.string().nullish(),
  totalReferrals: z.number().nonnegative(),
  completedReferrals: z.number().nonnegative(),
  pendingReferrals: z.number().nonnegative(),
  totalPointsEarned: z.number(),
});

const paginationSchema = z.object({
  page: z.number().int(),
  limit: z.number().int(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

// `GET /referral/history` and `GET /referral/rewards/transactions` both answer
// `{ items, pagination }`. Swagger documents no item shape and the test account has none,
// so an item is kept as a loose object and read by `referral.utils.ts` (every field optional).
const looseItemSchema = z.record(z.string(), z.unknown());

const looseItemsPageSchema = z.object({
  items: z.array(looseItemSchema),
  pagination: paginationSchema,
});

export const referralHistoryPageSchema = looseItemsPageSchema;
export const rewardTransactionsPageSchema = looseItemsPageSchema;

export type ReferralDashboard = z.infer<typeof referralDashboardSchema>;
export type ReferralLooseItem = z.infer<typeof looseItemSchema>;
export type ReferralItemsPage = z.infer<typeof looseItemsPageSchema>;
