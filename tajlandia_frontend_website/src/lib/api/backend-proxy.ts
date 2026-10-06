import "server-only";

import { getServerEnv } from "@/lib/config/server-env";
import { joinSameOriginUrl } from "@/lib/security/urls";
import { readSafeApiMessage } from "./errors";

// Only these backend areas are reachable through `/api/backend/*`. Add a prefix
// here when a new module starts calling it from the browser.
const ALLOWED_PREFIXES = new Set([
  "explore",
  "geography",
  "plots",
  "reservations",
  "cart",
]);
// Single endpoints whose area is otherwise off-limits (e.g. `dashboard/admin/*`).
const ALLOWED_EXACT_PATHS = new Set(["dashboard", "coupons"]);
const ALLOWED_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]);
const SAFE_SEGMENT = /^[\w-]{1,128}$/;
// The backend can be slow to wake from idle, so this is longer than `client.ts`.
const DEFAULT_TIMEOUT_MS = 20_000;
const MAX_REQUEST_BYTES = 100_000;
const MAX_RESPONSE_BYTES = 5_000_000;

export type BackendProxyOptions = {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
};

function jsonError(message: string, status: number) {
  return Response.json(
    { success: false, message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

function isAllowedPath(segments: string[]) {
  const [prefix] = segments;
  return (
    prefix !== undefined &&
    (ALLOWED_PREFIXES.has(prefix) || ALLOWED_EXACT_PATHS.has(segments.join("/"))) &&
    segments.every((segment) => SAFE_SEGMENT.test(segment))
  );
}

async function readRequestBody(request: Request): Promise<string | undefined | null> {
  if (request.method === "GET" || request.method === "DELETE") return undefined;

  const text = await request.text();
  if (!text) return undefined;
  if (text.length > MAX_REQUEST_BYTES) return null;

  try {
    JSON.parse(text);
    return text;
  } catch {
    return null;
  }
}

/**
 * Forwards a browser request to the backend with the caller's Bearer token.
 * Error bodies are reduced to a safe `{ success: false, message }`.
 */
export async function proxyToBackend(
  request: Request,
  segments: string[],
  options: BackendProxyOptions = {},
): Promise<Response> {
  if (!ALLOWED_METHODS.has(request.method)) {
    return jsonError("Method not allowed", 405);
  }

  if (!isAllowedPath(segments)) {
    return jsonError("Not found", 404);
  }

  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return jsonError("Authentication is required.", 401);
  }

  const apiUrl = getServerEnv().NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    return jsonError("API is not configured", 500);
  }

  const url = joinSameOriginUrl(apiUrl, segments.join("/"));
  if (!url) {
    return jsonError("Not found", 404);
  }
  url.search = new URL(request.url).search;

  const body = await readRequestBody(request);
  if (body === null) {
    return jsonError("Validation failed", 400);
  }

  const headers = new Headers({
    Accept: "application/json",
    Authorization: authorization,
  });
  if (body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  let response: Response;

  try {
    response = await fetchImpl(url, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(options.timeoutMs ?? DEFAULT_TIMEOUT_MS),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return jsonError("The request timed out", 504);
    }

    return jsonError("Unable to reach the API", 503);
  }

  const contentLength = Number(response.headers.get("content-length"));
  if (contentLength > MAX_RESPONSE_BYTES) {
    return jsonError("API response too large", 502);
  }

  const text = await response.text();
  if (text.length > MAX_RESPONSE_BYTES) {
    return jsonError("API response too large", 502);
  }

  let json: unknown = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      if (response.ok) return jsonError("Unexpected API response", 502);
    }
  }

  if (!response.ok) {
    return jsonError(readSafeApiMessage(json, "The request failed"), response.status);
  }

  if (!text) {
    return new Response(null, {
      status: response.status === 200 ? 204 : response.status,
      headers: { "Cache-Control": "no-store" },
    });
  }

  return Response.json(json, {
    status: response.status,
    headers: { "Cache-Control": "no-store" },
  });
}
