import "server-only";

import type { ZodType } from "zod";
import { getServerEnv } from "@/lib/config/server-env";
import { joinSameOriginUrl } from "@/lib/security/urls";

const DEFAULT_TIMEOUT_MS = 8_000;
const MAX_RESPONSE_BYTES = 1_000_000;

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code = "API_ERROR") {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export type ApiGetOptions = {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
};

export type ApiPostOptions = ApiGetOptions;

function resolveApiUrl(baseUrl: string, path: string): URL {
  const url = joinSameOriginUrl(baseUrl, path);

  if (!url) {
    throw new ApiError("Invalid API path", 400, "INVALID_API_PATH");
  }

  return url;
}

export async function apiGet<T>(
  path: string,
  schema: ZodType<T>,
  options: ApiGetOptions = {},
): Promise<T> {
  const env = getServerEnv();

  if (!env.NEXT_PUBLIC_API_URL) {
    throw new ApiError("API is not configured", 500, "API_NOT_CONFIGURED");
  }

  const url = resolveApiUrl(env.NEXT_PUBLIC_API_URL, path);
  const headers = new Headers({ Accept: "application/json" });

  if (env.API_SECRET) {
    headers.set("Authorization", `Bearer ${env.API_SECRET}`);
  }

  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const fetchImpl = options.fetchImpl ?? fetch;

  let response: Response;

  try {
    response = await fetchImpl(url, {
      method: "GET",
      headers,
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError("The request timed out", 504, "API_TIMEOUT");
    }

    throw new ApiError("Unable to reach the API", 503, "API_UNAVAILABLE");
  } finally {
    clearTimeout(timer);
  }

  const contentLength = response.headers.get("content-length");

  if (contentLength && Number(contentLength) > MAX_RESPONSE_BYTES) {
    throw new ApiError("API response too large", 502, "API_RESPONSE_TOO_LARGE");
  }

  if (!response.ok) {
    throw new ApiError("The request failed", response.status, "API_REQUEST_FAILED");
  }

  const json: unknown = await response.json();
  const parsed = schema.safeParse(json);

  if (!parsed.success) {
    throw new ApiError("Unexpected API response", 502, "API_INVALID_RESPONSE");
  }

  return parsed.data;
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  schema: ZodType<T>,
  options: ApiPostOptions = {},
): Promise<T> {
  const env = getServerEnv();

  if (!env.NEXT_PUBLIC_API_URL) {
    throw new ApiError("API is not configured", 500, "API_NOT_CONFIGURED");
  }

  const url = resolveApiUrl(env.NEXT_PUBLIC_API_URL, path);
  const headers = new Headers({
    Accept: "application/json",
    "Content-Type": "application/json",
  });

  if (env.API_SECRET) {
    headers.set("Authorization", `Bearer ${env.API_SECRET}`);
  }

  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const fetchImpl = options.fetchImpl ?? fetch;

  let response: Response;

  try {
    response = await fetchImpl(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError("The request timed out", 504, "API_TIMEOUT");
    }

    throw new ApiError("Unable to reach the API", 503, "API_UNAVAILABLE");
  } finally {
    clearTimeout(timer);
  }

  const contentLength = response.headers.get("content-length");

  if (contentLength && Number(contentLength) > MAX_RESPONSE_BYTES) {
    throw new ApiError("API response too large", 502, "API_RESPONSE_TOO_LARGE");
  }

  if (!response.ok) {
    throw new ApiError("The request failed", response.status, "API_REQUEST_FAILED");
  }

  const json: unknown = await response.json();
  const parsed = schema.safeParse(json);

  if (!parsed.success) {
    throw new ApiError("Unexpected API response", 502, "API_INVALID_RESPONSE");
  }

  return parsed.data;
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
