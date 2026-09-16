const TOKEN_KEY = "tajlandia_auth_token";
const USER_KEY = "tajlandia_user";

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getStoredUser(): Record<string, unknown> | null {
  try {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
}

export function setAuthToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Fail silently if localStorage is unavailable
  }
}

export function setAuthUser(user: Record<string, unknown>): void {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // Fail silently if localStorage is unavailable
  }
}

export function clearAuth(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    // Fail silently if localStorage is unavailable
  }
}

export function isAuthenticated(): boolean {
  return Boolean(getStoredToken());
}
