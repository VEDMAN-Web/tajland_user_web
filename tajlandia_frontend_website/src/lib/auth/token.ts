import "server-only";

/**
 * Lightweight JWT utilities — decode only, no signature verification.
 * Verification is the backend's responsibility. We only need to read
 * the payload to decide whether to refresh before a token expires.
 */

export type JwtPayload = {
  sub: string;
  email: string;
  iat: number;
  exp: number;
};

type DecodeResult =
  | { ok: true; payload: JwtPayload }
  | { ok: false; reason: string };

/**
 * Decodes a JWT without verifying the signature.
 * Returns the parsed payload or a failure reason.
 */
export function decodeJwt(token: string): DecodeResult {
  const parts = token.split(".");

  if (parts.length !== 3) {
    return { ok: false, reason: "Malformed JWT: expected 3 segments" };
  }

  // Base64url → base64 → Buffer → JSON
  const segment = parts[1];

  if (!segment) {
    return { ok: false, reason: "Malformed JWT: missing payload segment" };
  }

  try {
    const padded = segment.replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(padded, "base64").toString("utf-8");
    const raw: unknown = JSON.parse(json);

    if (
      typeof raw !== "object" ||
      raw === null ||
      typeof (raw as Record<string, unknown>).sub !== "string" ||
      typeof (raw as Record<string, unknown>).email !== "string" ||
      typeof (raw as Record<string, unknown>).iat !== "number" ||
      typeof (raw as Record<string, unknown>).exp !== "number"
    ) {
      return { ok: false, reason: "JWT payload missing required fields" };
    }

    return {
      ok: true,
      payload: raw as JwtPayload,
    };
  } catch {
    return { ok: false, reason: "JWT payload could not be decoded" };
  }
}

/**
 * Returns true if the token will expire within the given buffer (default 60s).
 * Returns true if the token cannot be decoded — treat as expired.
 */
export function isTokenExpiringSoon(token: string, bufferSeconds = 60): boolean {
  const result = decodeJwt(token);

  if (!result.ok) {
    return true;
  }

  const nowSeconds = Math.floor(Date.now() / 1_000);
  return result.payload.exp - nowSeconds <= bufferSeconds;
}

/**
 * Returns true if the token is already past its expiry.
 */
export function isTokenExpired(token: string): boolean {
  return isTokenExpiringSoon(token, 0);
}
