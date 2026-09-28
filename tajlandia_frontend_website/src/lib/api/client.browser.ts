/**
 * Browser-side API client.
 *
 * Mirrors the server-only client.ts in contract (ApiError shape, timeout,
 * size guard) but reads the JWT from localStorage/sessionStorage via
 * getStoredToken() instead of API_SECRET, so it can be called from
 * "use client" components and hooks.
 */

import { getStoredToken } from "@/lib/api/auth.utils";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_RESPONSE_BYTES = 2_000_000;

// ─── Error ────────────────────────────────────────────────────────────────────

export class BrowserApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code = "API_ERROR") {
    super(message);
    this.name = "BrowserApiError";
    this.status = status;
    this.code = code;
  }
}

export function isBrowserApiError(error: unknown): error is BrowserApiError {
  return error instanceof BrowserApiError;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
  // Remove leading slash from path if present, so it doesn't override the base URL path
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  
  // Ensure base URL ends with slash for proper URL joining
  const baseWithSlash = BASE_URL.endsWith("/") ? BASE_URL : BASE_URL + "/";
  
  const url = new URL(cleanPath, baseWithSlash);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
}

function buildHeaders(extra?: Record<string, string>): Headers {
  const token = getStoredToken();
  const headers = new Headers({
    Accept: "application/json",
    "Content-Type": "application/json",
    ...extra,
  });

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return headers;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const contentLength = response.headers.get("content-length");
  if (contentLength && Number(contentLength) > MAX_RESPONSE_BYTES) {
    throw new BrowserApiError("Response too large", 502, "RESPONSE_TOO_LARGE");
  }

  if (response.status === 401) {
    const token = getStoredToken();
    console.error("[API] 401 Unauthorized");
    console.error("[API] Token present:", !!token);
    console.error("[API] Token prefix:", token?.substring(0, 20));
    console.error("[API] URL:", response.url);
    
    // Try to decode JWT to check expiration
    if (token) {
      try {
        const parts = token.split('.');
        if (parts[1]) {
          const payload = JSON.parse(atob(parts[1]));
          const exp = payload.exp ? new Date(payload.exp * 1000) : null;
          const now = new Date();
          console.error("[API] Token expires:", exp);
          console.error("[API] Current time:", now);
          console.error("[API] Token expired:", exp ? exp < now : 'unknown');
        }
      } catch (e) {
        console.error("[API] Failed to decode token:", e);
      }
    }
    
    throw new BrowserApiError("Session expired. Please log in again.", 401, "UNAUTHORIZED");
  }

  if (response.status === 404) {
    throw new BrowserApiError("Not found", 404, "NOT_FOUND");
  }

  if (!response.ok) {
    // Try to surface a backend error message
    try {
      const body = (await response.json()) as { message?: string };
      console.error("[API] Error response:", response.status, body);
      throw new BrowserApiError(
        body.message ?? "Request failed",
        response.status,
        "API_REQUEST_FAILED",
      );
    } catch (inner) {
      if (inner instanceof BrowserApiError) throw inner;
      console.error("[API] Failed to parse error:", inner);
      throw new BrowserApiError("Request failed", response.status, "API_REQUEST_FAILED");
    }
  }

  return response.json() as Promise<T>;
}

async function withTimeout<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  ms = DEFAULT_TIMEOUT_MS,
): Promise<T> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), ms);

  try {
    return await fn(controller.signal);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new BrowserApiError("Request timed out", 504, "TIMEOUT");
    }
    throw error;
  } finally {
    window.clearTimeout(timer);
  }
}

// ─── Public surface ───────────────────────────────────────────────────────────

export async function browserGet<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
): Promise<T> {
  const url = buildUrl(path, params);
  console.log("[API GET]", url);

  return withTimeout((signal) =>
    fetch(url, {
      method: "GET",
      headers: buildHeaders(),
      cache: "no-store",
      signal,
    }).then((r) => parseResponse<T>(r)),
  );
}

export async function browserPost<T>(
  path: string,
  body?: unknown,
): Promise<T> {
  const url = buildUrl(path);

  return withTimeout((signal) =>
    fetch(url, {
      method: "POST",
      headers: buildHeaders(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
      signal,
    }).then((r) => parseResponse<T>(r)),
  );
}

export async function browserDelete<T>(
  path: string,
): Promise<T> {
  const url = buildUrl(path);

  return withTimeout((signal) =>
    fetch(url, {
      method: "DELETE",
      headers: buildHeaders(),
      cache: "no-store",
      signal,
    }).then((r) => parseResponse<T>(r)),
  );
}
