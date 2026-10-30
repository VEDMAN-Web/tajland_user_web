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

const LOADING_STATE: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  isLoading: true,
};

function readStoredAuth(): AuthState {
  // Check if user is authenticated by checking for stored token
  const token = getStoredToken();
  const user = getStoredUser() as AuthUser | null;

  if (token && user) {
    return { isAuthenticated: true, user, token, isLoading: false };
  }
  return { isAuthenticated: false, user: null, token: null, isLoading: false };
}

// Flips to true in the browser once any `useAuth` has read the stored session. The
// first render of a page load must still start as "loading" (it has to match the
// server's HTML). After that, a page opened by clicking a link starts with the real
// state instead of flashing a full-screen loader for one frame before its effect runs.
let hasReadAuth = false;

export function useAuth(): AuthState {
  const [authState, setAuthState] = useState<AuthState>(() =>
    hasReadAuth ? readStoredAuth() : LOADING_STATE,
  );

  const readAuthState = useCallback(() => {
    hasReadAuth = true;
    setAuthState(readStoredAuth());
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
