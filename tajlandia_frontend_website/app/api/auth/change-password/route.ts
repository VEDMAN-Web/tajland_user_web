import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerEnv } from "@/lib/config/server-env";

const changePasswordBodySchema = z.object({
  currentPassword: z.string().min(1).max(100),
  newPassword: z.string().min(8).max(100),
});

const SAFE_API_MESSAGE = /^[\w\s.,'!?:()-]{1,180}$/;

function readMessage(json: unknown, fallback: string) {
  if (!json || typeof json !== "object" || !("message" in json)) {
    return fallback;
  }

  const message = json.message;
  const text = typeof message === "string"
    ? message
    : Array.isArray(message)
      ? message.filter((item): item is string => typeof item === "string").join(" ")
      : "";

  const trimmed = text.trim();
  return SAFE_API_MESSAGE.test(trimmed) ? trimmed : fallback;
}

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  const apiUrl = getServerEnv().NEXT_PUBLIC_API_URL;

  if (!authorization?.startsWith("Bearer ") || !apiUrl) {
    return NextResponse.json({ success: false, message: "Authentication is required." }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "Validation failed" }, { status: 400 });
  }

  const parsed = changePasswordBodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ success: false, message: "Validation failed" }, { status: 400 });
  }

  try {
    const response = await fetch(`${apiUrl.replace(/\/$/, "")}/auth/change-password`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: authorization,
      },
      body: JSON.stringify(parsed.data),
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });

    const json: unknown = await response.json().catch(() => null);
    const success = response.ok && (!json || typeof json !== "object" || !("success" in json) || json.success !== false);

    return NextResponse.json(
      {
        success,
        message: readMessage(json, success ? "Password changed successfully" : "The request failed"),
      },
      { status: response.status },
    );
  } catch {
    return NextResponse.json({ success: false, message: "Unable to update your password right now. Please try again." }, { status: 503 });
  }
}
