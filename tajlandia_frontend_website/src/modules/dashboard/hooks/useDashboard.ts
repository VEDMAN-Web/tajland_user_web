/**
 * Dashboard State Management Hook
 * 
 * Manages dashboard data fetching, caching, and state
 * Provides loading, error, and retry capabilities
 */

import { useEffect, useState, useCallback } from "react";
import { getDashboard } from "@/lib/api/dashboard.service";
import type {
  DashboardUser,
  DashboardCollection,
  DashboardVerification,
  FeaturedRegion,
} from "@/lib/api/dashboard.schemas";

// ============================================================================
// Hook State Interface
// ============================================================================

export interface UseDashboardState {
  // Data
  user: DashboardUser | null;
  collection: DashboardCollection | null;
  verification: DashboardVerification | null;
  featuredRegions: FeaturedRegion[];
  giftEnabled: boolean;
  
  // States
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  
  // Actions
  refresh: () => Promise<void>;
  clearError: () => void;
}

// ============================================================================
// Hook Options Interface
// ============================================================================

export interface UseDashboardOptions {
  /**
   * Whether to fetch data immediately on mount
   * @default true
   */
  fetchOnMount?: boolean;
  
  /**
   * Callback when data is successfully loaded
   */
  onSuccess?: (data: {
    user: DashboardUser;
    collection: DashboardCollection;
    verification: DashboardVerification;
    featuredRegions: FeaturedRegion[];
    giftEnabled: boolean;
  }) => void;
  
  /**
   * Callback when an error occurs
   */
  onError?: (error: string) => void;
}

// ============================================================================
// Main Hook
// ============================================================================

/**
 * Custom hook for managing dashboard data
 * 
 * Features:
 * - Automatic data fetching on mount
 * - Loading and error states
 * - Manual refresh capability
 * - Type-safe data access
 * - Memory-efficient caching
 * 
 * @param options - Configuration options
 * @returns Dashboard state and actions
 * 
 * @example
 * ```typescript
 * function DashboardPage() {
 *   const {
 *     user,
 *     collection,
 *     verification,
 *     featuredRegions,
 *     giftEnabled,
 *     isLoading,
 *     error,
 *     refresh,
 *   } = useDashboard();
 * 
 *   if (isLoading) return <LoadingSpinner />;
 *   if (error) return <ErrorMessage message={error} onRetry={refresh} />;
 * 
 *   return (
 *     <div>
 *       <h1>Welcome {user?.name}</h1>
 *       <p>Plots: {collection?.plotsClaimed}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useDashboard(options: UseDashboardOptions = {}): UseDashboardState {
  const { fetchOnMount = true, onSuccess, onError } = options;

  // State
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [collection, setCollection] = useState<DashboardCollection | null>(null);
  const [verification, setVerification] = useState<DashboardVerification | null>(null);
  const [featuredRegions, setFeaturedRegions] = useState<FeaturedRegion[]>([]);
  const [giftEnabled, setGiftEnabled] = useState<boolean>(false);
  
  const [isLoading, setIsLoading] = useState<boolean>(fetchOnMount);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch function
  const fetchDashboard = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const data = await getDashboard();

      // Update all state
      setUser(data.user);
      setCollection(data.collection);
      setVerification(data.verification);
      setFeaturedRegions(data.featuredRegions);
      setGiftEnabled(data.gift.enabled);

      // Success callback
      if (onSuccess) {
        onSuccess({
          user: data.user,
          collection: data.collection,
          verification: data.verification,
          featuredRegions: data.featuredRegions,
          giftEnabled: data.gift.enabled,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : "Failed to load dashboard. Please try again.";
      
      setError(errorMessage);
      
      // Error callback
      if (onError) {
        onError(errorMessage);
      }
      
      console.error("useDashboard fetch error:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [onSuccess, onError]);

  // Fetch on mount
  useEffect(() => {
    if (fetchOnMount) {
      fetchDashboard(false);
    }
  }, [fetchOnMount, fetchDashboard]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    await fetchDashboard(true);
  }, [fetchDashboard]);

  // Clear error function
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Data
    user,
    collection,
    verification,
    featuredRegions,
    giftEnabled,
    
    // States
    isLoading,
    isRefreshing,
    error,
    
    // Actions
    refresh,
    clearError,
  };
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Hook for just checking if user has verified holdings
 * Lightweight alternative when you only need verification status
 * 
 * @example
 * ```typescript
 * const { isVerified, isLoading } = useDashboardVerification();
 * if (isVerified) {
 *   // Show verified badge
 * }
 * ```
 */
export function useDashboardVerification() {
  const { verification, isLoading, error } = useDashboard({
    fetchOnMount: true,
  });

  return {
    isVerified: verification?.verified ?? false,
    verificationStatus: verification?.status ?? "unverified",
    verificationMessage: verification?.message ?? "",
    isLoading,
    error,
  };
}

/**
 * Hook for just getting collection stats
 * Lightweight alternative when you only need portfolio numbers
 * 
 * @example
 * ```typescript
 * const { plotsClaimed, totalSpent, isLoading } = useDashboardStats();
 * ```
 */
export function useDashboardStats() {
  const { collection, isLoading, error } = useDashboard({
    fetchOnMount: true,
  });

  return {
    totalLandSqFt: collection?.totalLandSqFt ?? 0,
    totalLandRai: collection?.totalLandRai ?? 0,
    plotsClaimed: collection?.plotsClaimed ?? 0,
    regionsCount: collection?.regionsCount ?? 0,
    totalSpent: collection?.totalSpent ?? 0,
    currency: collection?.currency ?? "USD",
    isLoading,
    error,
  };
}
