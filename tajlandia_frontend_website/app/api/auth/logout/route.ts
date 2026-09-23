import { NextRequest, NextResponse } from "next/server";
import { getServerEnv } from "@/lib/config/server-env";

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  const apiUrl = getServerEnv().NEXT_PUBLIC_API_URL;

  if (!authorization || !apiUrl) {
    return NextResponse.json({ success: false, message: "Authentication is required." }, { status: 401 });
  }

  try {
    const response = await fetch(`${apiUrl.replace(/\/$/, "")}/auth/logout`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: authorization,
      },
      cache: "no-store",
    });

    return new NextResponse(null, { status: response.status });
  } catch {
    return NextResponse.json({ success: false, message: "Logout service unavailable." }, { status: 503 });
  }
}