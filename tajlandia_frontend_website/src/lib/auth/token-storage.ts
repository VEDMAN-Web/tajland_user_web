const ACCESS_TOKEN_KEY = "tajlandia_access_token";
const REFRESH_TOKEN_KEY = "tajlandia_refresh_token";

export function getAccessToken(): string | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.localStorage.getItem(ACCESS_TOKEN_KEY) ?? undefined;
}

export function storeAuthTokens(accessToken: string, refreshToken: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}
