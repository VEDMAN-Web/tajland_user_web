'use client';

import { useCallback, useEffect, useState } from 'react';
import { AUTH_TOKEN_KEY, AUTH_USER_KEY, getStoredToken, getStoredUser } from '@/lib/api/auth.utils';

export interface AuthUser {
  id?: string;
  email?: string;
  name?: string;
  role?: string;
  isActive?: boolean;
  isEmailVerified?: boolean;
  phone?: string;
  avatarUrl?: string;
  createdAt?: string;
  memberSince?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
}

export function useAuth(): AuthState {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    isLoading: true,
  });

  const readAuthState = useCallback(() => {
    // Check if user is authenticated by checking for stored token
    const token = getStoredToken();
    const user = getStoredUser() as AuthUser | null;

    if (token && user) {
      setAuthState({
        isAuthenticated: true,
        user,
        token,
        isLoading: false,
      });
    } else {
      setAuthState({
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false,
      });
    }
  }, []);

  useEffect(() => {
    readAuthState();

    // `storage` fires only in *other* same-origin tabs, so a login or logout there
    // (e.g. from AccountMenu's clearAuth()) is reflected here without a manual refresh.
    function handleStorage(event: StorageEvent) {
      if (event.key === AUTH_TOKEN_KEY || event.key === AUTH_USER_KEY || event.key === null) {
        readAuthState();
      }
    }

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [readAuthState]);

  return authState;
}
