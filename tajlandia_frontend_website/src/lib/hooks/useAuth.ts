'use client';

import { useEffect, useState } from 'react';
import { getStoredToken, getStoredUser } from '@/lib/api/auth.utils';

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

export function useAuth(): AuthState {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    isLoading: true,
  });

  useEffect(() => {
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

  return authState;
}
