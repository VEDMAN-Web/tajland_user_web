const TOKEN_KEY = "tajlandia_auth_token";
const USER_KEY = "tajlandia_user";

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getStoredUser(): Record<string, unknown> | null {
  try {
    const user = localStorage.getItem(USER_KEY) ?? sessionStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
}

export function setAuthToken(token: string, rememberMe = true): void {
  try {
    const storage = rememberMe ? localStorage : sessionStorage;
    const otherStorage = rememberMe ? sessionStorage : localStorage;
    storage.setItem(TOKEN_KEY, token);
    otherStorage.removeItem(TOKEN_KEY);
  } catch {
    // Fail silently if localStorage is unavailable
  }
}

export function setAuthUser(user: Record<string, unknown>, rememberMe = true): void {
  try {
    const storage = rememberMe ? localStorage : sessionStorage;
    const otherStorage = rememberMe ? sessionStorage : localStorage;
    storage.setItem(USER_KEY, JSON.stringify(user));
    otherStorage.removeItem(USER_KEY);
  } catch {
    // Fail silently if localStorage is unavailable
  }
}

/** True when the session was saved with "remember me" (localStorage). */
export function isRememberedSession(): boolean {
  try {
    return Boolean(localStorage.getItem(TOKEN_KEY));
  } catch {
    return false;
  }
}

export function clearAuth(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  } catch {
    // Fail silently if localStorage is unavailable
  }
}

export function isAuthenticated(): boolean {
  return Boolean(getStoredToken());
}
