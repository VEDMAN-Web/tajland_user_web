/**
 * Dashboard API Type Definitions and Zod Schemas
 * 
 * Validates responses from GET /api/v1/dashboard
 * Ensures type safety for user portfolio data
 */

import { z } from "zod";

// ============================================================================
// User Schema
// ============================================================================

export const DashboardUserSchema = z.object({
  id: z.string().min(1, "User ID is required"),
  name: z.string().min(1, "User name is required"),
  email: z.string().email("Invalid email format"),
  avatarUrl: z.string().optional().nullable().transform(val => val || null),
});

export type DashboardUser = z.infer<typeof DashboardUserSchema>;

// ============================================================================
// Collection Stats Schema
// ============================================================================

export const DashboardCollectionSchema = z.object({
  totalLandSqFt: z.number().nonnegative("Total land cannot be negative"),
  totalLandRai: z.number().nonnegative("Total land rai cannot be negative"),
  plotsClaimed: z.number().int().nonnegative("Plots claimed must be non-negative integer"),
  regionsCount: z.number().int().nonnegative("Regions count must be non-negative integer"),
  totalSpent: z.number().nonnegative("Total spent cannot be negative"),
  currency: z.string().min(1, "Currency is required").default("USD"),
});

export type DashboardCollection = z.infer<typeof DashboardCollectionSchema>;

// ============================================================================
// Verification Schema
// ============================================================================

export const DashboardVerificationStatusSchema = z.enum([
  "verified",
  "pending",
  "unverified",
  "not_verified",
]);

export type DashboardVerificationStatus = z.infer<typeof DashboardVerificationStatusSchema>;

export const DashboardVerificationSchema = z.object({
  verified: z.boolean(),
  verifiedHoldings: z.number().int().nonnegative("Verified holdings must be non-negative"),
  totalHoldings: z.number().int().nonnegative("Total holdings must be non-negative"),
  status: DashboardVerificationStatusSchema,
  message: z.string().min(1, "Verification message is required"),
});

export type DashboardVerification = z.infer<typeof DashboardVerificationSchema>;

// ============================================================================
// Featured Region Schema
// ============================================================================

export const FeaturedRegionSchema = z.object({
  id: z.string().min(1, "Region ID is required"),
  name: z.string().min(1, "Region name is required"),
  slug: z.string().min(1, "Region slug is required"),
  description: z.string().min(1, "Region description is required"),
  imageUrl: z.string().url("Invalid image URL"),
  locationCount: z.number().int().nonnegative("Location count must be non-negative"),
  badge: z.string().min(1, "Badge is required"),
  displayOrder: z.number().int().nonnegative("Display order must be non-negative"),
});

export type FeaturedRegion = z.infer<typeof FeaturedRegionSchema>;

// ============================================================================
// Gift Schema
// ============================================================================

export const DashboardGiftSchema = z.object({
  enabled: z.boolean(),
});

export type DashboardGift = z.infer<typeof DashboardGiftSchema>;

// ============================================================================
// Main Dashboard Response Schema
// ============================================================================

export const DashboardResponseSchema = z.object({
  user: DashboardUserSchema,
  collection: DashboardCollectionSchema,
  verification: DashboardVerificationSchema,
  featuredRegions: z.array(FeaturedRegionSchema),
  gift: DashboardGiftSchema,
});

export type DashboardResponse = z.infer<typeof DashboardResponseSchema>;

// ============================================================================
// API Response Wrapper Schema
// ============================================================================

export const DashboardApiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: DashboardResponseSchema,
});

export type DashboardApiResponse = z.infer<typeof DashboardApiResponseSchema>;

// ============================================================================
// Default/Fallback Values
// ============================================================================

export const DEFAULT_DASHBOARD_COLLECTION: DashboardCollection = {
  totalLandSqFt: 0,
  totalLandRai: 0,
  plotsClaimed: 0,
  regionsCount: 0,
  totalSpent: 0,
  currency: "USD",
};

export const DEFAULT_DASHBOARD_VERIFICATION: DashboardVerification = {
  verified: false,
  verifiedHoldings: 0,
  totalHoldings: 0,
  status: "not_verified",
  message: "Account verification pending",
};

export const DEFAULT_DASHBOARD_GIFT: DashboardGift = {
  enabled: false,
};
