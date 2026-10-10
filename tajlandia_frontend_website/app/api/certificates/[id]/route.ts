import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAllowedRemoteImage } from "@/lib/config/remote-images";
import { getServerEnv } from "@/lib/config/server-env";

// Order ids are Mongo ObjectIds.
const ORDER_ID = /^[a-f\d]{24}$/i;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

const orderCertificateSchema = z.object({
  success: z.literal(true),
  data: z.object({
    status: z.string(),
    certificateNo: z.string().nullish(),
    certificateUrl: z.string().nullish(),
  }),
});

function jsonError(message: string, status: number) {
  return NextResponse.json(
    { success: false, message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

/**
 * Downloads the certificate of one of the caller's paid orders. The image is
 * hosted elsewhere, so the browser can't save it with a plain `download` link;
 * this checks the order with the caller's token and returns it as an attachment.
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const authorization = request.headers.get("authorization");
  const apiUrl = getServerEnv().NEXT_PUBLIC_API_URL;

  if (!authorization?.startsWith("Bearer ") || !apiUrl) {
    return jsonError("Authentication is required.", 401);
  }
  if (!ORDER_ID.test(id)) return jsonError("Certificate not found", 404);

  let order: z.infer<typeof orderCertificateSchema>["data"];
  try {
    const response = await fetch(`${apiUrl.replace(/\/$/, "")}/orders/${id}`, {
      headers: { Accept: "application/json", Authorization: authorization },
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
    if (response.status === 401) return jsonError("Authentication is required.", 401);
    if (!response.ok) return jsonError("Certificate not found", response.status === 404 || response.status === 400 ? 404 : 502);
    const parsed = orderCertificateSchema.safeParse(await response.json().catch(() => null));
    if (!parsed.success) return jsonError("Unexpected API response", 502);
    order = parsed.data.data;
  } catch {
    return jsonError("Unable to reach the API", 503);
  }

  if (order.status !== "paid" || !isAllowedRemoteImage(order.certificateUrl, apiUrl)) {
    return jsonError("Certificate not ready yet", 404);
  }

  let image: Response;
  try {
    image = await fetch(order.certificateUrl, { cache: "no-store", signal: AbortSignal.timeout(20_000) });
  } catch {
    return jsonError("Unable to download the certificate", 502);
  }

  const type = image.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
  const extension = IMAGE_EXTENSIONS[type];
  if (!image.ok || !extension) return jsonError("Unable to download the certificate", 502);

  const body = await image.arrayBuffer();
  if (body.byteLength > MAX_IMAGE_BYTES) return jsonError("Unable to download the certificate", 502);

  const name = (order.certificateNo ?? `certificate-${id}`).replace(/[^\w.-]/g, "_");
  return new Response(body, {
    headers: {
      "Content-Type": type,
      "Content-Disposition": `attachment; filename="${name}.${extension}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
