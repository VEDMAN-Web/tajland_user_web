import { createHash, timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { getServerEnv } from "@/lib/config/server-env";
import { BLOG_CACHE_TAG } from "@/modules/blog/services/blog.api";

function jsonResult(body: { success: boolean; message?: string }, status: number) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

// Hashing first gives both sides the same length, which `timingSafeEqual` needs.
function sameSecret(received: string, expected: string) {
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(received), digest(expected));
}

/**
 * Called by the admin panel's server after a blog is created, changed or deleted, so
 * the website shows it now instead of when the 5 minute cache runs out.
 */
export async function POST(request: NextRequest) {
  const secret = getServerEnv().REVALIDATE_SECRET;
  if (!secret) return jsonResult({ success: false, message: "Revalidation is not configured." }, 503);

  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : "";
  if (!token || !sameSecret(token, secret)) {
    return jsonResult({ success: false, message: "Unauthorized." }, 401);
  }

  // `expire: 0`: not a Server Action, and the next visit must already see the change.
  revalidateTag(BLOG_CACHE_TAG, { expire: 0 });
  return jsonResult({ success: true }, 200);
}
