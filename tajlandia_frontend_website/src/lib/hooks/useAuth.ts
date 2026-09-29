'use client';

import { useEffect, useState } from 'react';
import { getStoredToken, getStoredUser, clearAuth } from '@/lib/api/auth.utils';

export interface AuthUser {
  id?: string;
  email?: string;
  name?: string;
  role?: string;
  isActive?: boolean;
  isEmailVerified?: boolean;
  phone?: string;
  avatarUrl?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
}

/**
 * Check if JWT token is expired
 */
function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3 || !parts[1]) return true;
    
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) return false; // No expiration = assume valid
    
    const expirationTime = payload.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    
    // Token is expired if expiration time has passed
    // No safety margin - respect the backend's expiration exactly
    return now >= expirationTime;
  } catch (error) {
    console.error('[useAuth] Failed to decode token:', error);
    return true; // If we can't decode, consider expired
  }
}

/**
 * Validate stored auth and return auth state
 */
function validateAuth(): { isAuthenticated: boolean; user: AuthUser | null; token: string | null } {
  const token = getStoredToken();
  const user = getStoredUser() as AuthUser | null;

  // No token = not authenticated
  if (!token || !user) {
    return { isAuthenticated: false, user: null, token: null };
  }

  // Check if token is expired
  if (isTokenExpired(token)) {
    // Decode token to show expiration details
    try {
      const parts = token.split('.');
      if (parts[1]) {
        const payload = JSON.parse(atob(parts[1]));
        const expirationTime = payload.exp ? new Date(payload.exp * 1000) : null;
        const now = new Date();
        console.warn('[useAuth] Token expired:', {
          expiresAt: expirationTime?.toISOString(),
          now: now.toISOString(),
          expiredMinutesAgo: expirationTime ? Math.round((now.getTime() - expirationTime.getTime()) / 60000) : 'N/A'
        });
      }
    } catch (e) {
      // Ignore decode errors
    }
    
    console.warn('[useAuth] Token expired, clearing auth');
    clearAuth();
    return { isAuthenticated: false, user: null, token: null };
  }

  return { isAuthenticated: true, user, token };
}

export function useAuth(): AuthState {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    isLoading: true,
  });

  useEffect(() => {
    // Initial validation
    const validated = validateAuth();
    setAuthState({ ...validated, isLoading: false });

    // Re-validate every 10 minutes to catch expired tokens
    // (For 7-day tokens, checking every minute is excessive)
    const interval = setInterval(() => {
      const revalidated = validateAuth();
      setAuthState((prev) => {
        // Only update if auth state actually changed
        if (prev.isAuthenticated !== revalidated.isAuthenticated) {
          console.log('[useAuth] Auth state changed:', revalidated.isAuthenticated);
          return { ...revalidated, isLoading: false };
        }
        return prev;
      });
    }, 10 * 60 * 1000); // Check every 10 minutes (was 1 minute)

    // Listen for storage changes (cross-tab logout/login)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'tajlandia_auth_token' || e.key === 'tajlandia_user') {
        console.log('[useAuth] Storage changed, revalidating');
        const revalidated = validateAuth();
        setAuthState({ ...revalidated, isLoading: false });
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return authState;
}
