import type { ZodType } from "zod";
import { clearAuth, getStoredToken } from "@/lib/api/auth.utils";
import { routes } from "@/lib/constants/routes";
import { toSafeInternalRedirect } from "@/lib/security/redirects";
import { apiEnvelope } from "./envelope";
import { ApiError, readSafeApiMessage } from "./errors";

// Browser → `/api/backend/*` (app/api/backend/[...path]/route.ts) → backend.
// Use these from module `*.client.ts` services, never from UI files directly.

const PROXY_BASE = "/api/backend";
const DEFAULT_TIMEOUT_MS = 25_000;
const SESSION_EXPIRED_MESSAGE = "Your session has expired. Please log in again.";

export type QueryValue = string | number | boolean | null | undefined;

export type AuthedRequestOptions = {
  query?: Record<string, QueryValue>;
  /** Abort from the caller, e.g. when the map moves before the last request finished. */
  signal?: AbortSignal;
  timeoutMs?: number;
  /** On 401, clear the session and send the user to login. Defaults to true. */
  redirectOnUnauthorized?: boolean;
  fetchImpl?: typeof fetch;
};

export function isAbortError(error: unknown): boolean {
  return error instanceof ApiError && error.code === "API_ABORTED";
}

function buildUrl(path: string, query: AuthedRequestOptions["query"]) {
  if (
    !path.startsWith("/") ||
    path.includes("//") ||
    path.includes("..") ||
    path.includes("\\") ||
    path.includes("?")
  ) {
    throw new ApiError("Invalid API path", 400, "INVALID_API_PATH");
  }

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }

  const search = params.toString();
  return `${PROXY_BASE}${path}${search ? `?${search}` : ""}`;
}

function endSession(redirect: boolean) {
  clearAuth();
  if (!redirect) return;

  const next = toSafeInternalRedirect(window.location.pathname);
  window.location.assign(
    next ? `${routes.login}?next=${encodeURIComponent(next)}` : routes.login,
  );
}

async function request<T>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  body: unknown,
  schema: ZodType<T>,
  options: AuthedRequestOptions = {},
): Promise<T> {
  const redirect = options.redirectOnUnauthorized ?? true;
  const token = getStoredToken();

  if (!token) {
    endSession(redirect);
    throw new ApiError(SESSION_EXPIRED_MESSAGE, 401, "API_SESSION_EXPIRED");
  }

  const url = buildUrl(path, options.query);
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const abortFromCaller = () => controller.abort();

  if (options.signal?.aborted) {
    controller.abort();
  } else {
    options.signal?.addEventListener("abort", abortFromCaller, { once: true });
  }

  const headers = new Headers({
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  });
  if (body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;

  try {
    response = await (options.fetchImpl ?? fetch)(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      signal: controller.signal,
    });
  } catch {
    if (timedOut) {
      throw new ApiError("The request timed out", 504, "API_TIMEOUT");
    }

    if (controller.signal.aborted) {
      throw new ApiError("The request was cancelled", 499, "API_ABORTED");
    }

    throw new ApiError(
      "Unable to reach the server. Please try again.",
      503,
      "API_UNAVAILABLE",
    );
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener("abort", abortFromCaller);
  }

  const json: unknown = await response.json().catch(() => undefined);

  if (response.status === 401) {
    endSession(redirect);
    throw new ApiError(SESSION_EXPIRED_MESSAGE, 401, "API_SESSION_EXPIRED");
  }

  if (!response.ok) {
    throw new ApiError(
      readSafeApiMessage(json, "The request failed"),
      response.status,
      "API_REQUEST_FAILED",
    );
  }

  if (response.status === 204) {
    const empty = schema.safeParse(undefined);
    if (!empty.success) {
      throw new ApiError("Unexpected API response", 502, "API_INVALID_RESPONSE");
    }
    return empty.data;
  }

  const parsed = apiEnvelope(schema).safeParse(json);

  if (!parsed.success) {
    throw new ApiError("Unexpected API response", 502, "API_INVALID_RESPONSE");
  }

  if (!parsed.data.success) {
    throw new ApiError(
      readSafeApiMessage(json, "The request failed"),
      response.status,
      "API_REQUEST_FAILED",
    );
  }

  return parsed.data.data;
}

export function authedGet<T>(
  path: string,
  schema: ZodType<T>,
  options?: AuthedRequestOptions,
) {
  return request("GET", path, undefined, schema, options);
}

export function authedPost<T>(
  path: string,
  body: unknown,
  schema: ZodType<T>,
  options?: AuthedRequestOptions,
) {
  return request("POST", path, body ?? {}, schema, options);
}

export function authedPut<T>(
  path: string,
  body: unknown,
  schema: ZodType<T>,
  options?: AuthedRequestOptions,
) {
  return request("PUT", path, body ?? {}, schema, options);
}

export function authedDelete<T>(
  path: string,
  schema: ZodType<T>,
  options?: AuthedRequestOptions,
) {
  return request("DELETE", path, undefined, schema, options);
}
