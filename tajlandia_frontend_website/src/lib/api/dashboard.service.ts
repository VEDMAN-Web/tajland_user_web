/**
 * Dashboard API Service
 * 
 * Handles all dashboard-related API calls
 * Endpoint: GET /api/v1/dashboard
 */

import { browserGet } from "./client.browser";
import {
  DashboardResponse,
  DashboardResponseSchema,
  DashboardApiResponseSchema,
  DEFAULT_DASHBOARD_COLLECTION,
  DEFAULT_DASHBOARD_VERIFICATION,
  DEFAULT_DASHBOARD_GIFT,
} from "./dashboard.schemas";

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get User Dashboard Data
 * 
 * Fetches personalized dashboard with portfolio stats and featured regions
 * 
 * @returns Dashboard data including user info, collection stats, verification status, and featured regions
 * @throws Error if request fails or response validation fails
 * 
 * @example
 * ```typescript
 * try {
 *   const dashboard = await getDashboard();
 *   console.log(`Welcome ${dashboard.user.name}!`);
 *   console.log(`You own ${dashboard.collection.plotsClaimed} plots`);
 * } catch (error) {
 *   console.error('Failed to load dashboard:', error);
 * }
 * ```
 */
export async function getDashboard(): Promise<DashboardResponse> {
  try {
    const response = await browserGet<{ success: boolean; message?: string; data: DashboardResponse }>("/dashboard");
    
    // Backend returns { success, message, data } wrapper
    if (!response.data) {
      throw new Error("Invalid response structure from dashboard API");
    }
    
    // Validate the nested data
    const validated = DashboardResponseSchema.parse(response.data);

    return validated;
  } catch (error) {
    console.error("getDashboard error:", error);
    
    // If validation fails or API error, throw with user-friendly message
    if (error instanceof Error) {
      throw new Error(`Failed to load dashboard: ${error.message}`);
    }
    
    throw new Error("Failed to load dashboard. Please try again.");
  }
}

/**
 * Get Dashboard with Fallback Data
 * 
 * Safe version that returns default values on error instead of throwing
 * Useful for graceful degradation when backend is unavailable
 * 
 * @returns Dashboard data or default values if request fails
 * 
 * @example
 * ```typescript
 * const dashboard = await getDashboardSafe();
 * // Always returns data, never throws
 * ```
 */
export async function getDashboardSafe(): Promise<DashboardResponse> {
  try {
    return await getDashboard();
  } catch (error) {
    console.warn("Dashboard API failed, returning defaults:", error);
    
    // Return safe defaults if API fails
    return {
      user: {
        id: "",
        name: "User",
        email: "",
        avatarUrl: null,
      },
      collection: DEFAULT_DASHBOARD_COLLECTION,
      verification: DEFAULT_DASHBOARD_VERIFICATION,
      featuredRegions: [],
      gift: DEFAULT_DASHBOARD_GIFT,
    };
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format currency value for display
 * 
 * @param amount - The amount to format
 * @param currency - Currency code (default: USD)
 * @returns Formatted currency string
 * 
 * @example
 * formatCurrency(48500) // "$48,500"
 * formatCurrency(48500, "THB") // "฿48,500"
 */
export function formatCurrency(amount: number, currency: string = "USD"): string {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  
  return formatter.format(amount);
}

/**
 * Format land area for display
 * 
 * @param sqFt - Square feet value
 * @param rai - Rai value
 * @returns Formatted land area string
 * 
 * @example
 * formatLandArea(8000, 5.5) // "8,000 sq ft (5.5 rai)"
 */
export function formatLandArea(sqFt: number, rai: number): string {
  const formattedSqFt = sqFt.toLocaleString("en-US");
  const formattedRai = rai.toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  });
  
  return `${formattedSqFt} sq ft (${formattedRai} rai)`;
}

/**
 * Get verification status badge text
 * 
 * @param status - Verification status
 * @returns User-friendly status text
 */
export function getVerificationStatusText(
  status: "verified" | "pending" | "unverified" | "not_verified"
): string {
  const statusMap = {
    verified: "✓ Verified",
    pending: "⏳ Verification Pending",
    unverified: "⚠ Not Verified",
    not_verified: "⚠ Not Verified",
  };
  
  return statusMap[status] || statusMap.unverified;
}
