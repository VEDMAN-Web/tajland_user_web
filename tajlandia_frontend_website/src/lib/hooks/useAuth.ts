'use client';

import { useEffect, useState } from 'react';
import { getStoredToken, getStoredUser, clearAuth } from '@/lib/api/auth.utils';

// Extend window for token logging flag
declare global {
  interface Window {
    __tokenExpiryLogged?: boolean;
  }
}

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
    if (!payload.exp) return false;
    
    const expirationTime = payload.exp * 1000;
    const now = Date.now();
    
    return now >= expirationTime;
  } catch (error) {
    return true;
  }
}

/**
 * Validate stored auth and return auth state
 */
function validateAuth(): { isAuthenticated: boolean; user: AuthUser | null; token: string | null } {
  const token = getStoredToken();
  const user = getStoredUser() as AuthUser | null;

  if (!token || !user) {
    return { isAuthenticated: false, user: null, token: null };
  }

  if (isTokenExpired(token)) {
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
    const validated = validateAuth();
    setAuthState({ ...validated, isLoading: false });

    const interval = setInterval(() => {
      const revalidated = validateAuth();
      setAuthState((prev) => {
        if (prev.isAuthenticated !== revalidated.isAuthenticated) {
          return { ...revalidated, isLoading: false };
        }
        return prev;
      });
    }, 10 * 60 * 1000);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'tajlandia_auth_token' || e.key === 'tajlandia_user') {
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
