import { authedGet } from "@/lib/api/browser-client";
import {
  referralDashboardSchema,
  referralHistoryPageSchema,
  rewardTransactionsPageSchema,
  type ReferralDashboard,
  type ReferralItemsPage,
} from "../schemas/referral.schema";

export const REFERRAL_PAGE_SIZE = 10;

/** The user's referral code and totals (`GET /referral/dashboard`). */
export function getReferralDashboard(signal?: AbortSignal): Promise<ReferralDashboard> {
  return authedGet("/referral/dashboard", referralDashboardSchema, { signal });
}

/** People who signed up with the user's code, newest first (`GET /referral/history`). */
export function getReferralHistory(page: number, signal?: AbortSignal): Promise<ReferralItemsPage> {
  return authedGet("/referral/history", referralHistoryPageSchema, {
    signal,
    query: { page, limit: REFERRAL_PAGE_SIZE },
  });
}

/** Points the user earned or spent (`GET /referral/rewards/transactions`). */
export function getRewardTransactions(page: number, signal?: AbortSignal): Promise<ReferralItemsPage> {
  return authedGet("/referral/rewards/transactions", rewardTransactionsPageSchema, {
    signal,
    query: { page, limit: REFERRAL_PAGE_SIZE },
  });
}
