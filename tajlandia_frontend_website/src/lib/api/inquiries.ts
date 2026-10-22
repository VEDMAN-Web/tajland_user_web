"use server";

import { z } from "zod";
import { apiPost, isApiError } from "@/lib/api/client";
import { inquirySchema, type InquiryInput } from "@/lib/api/inquiry.schema";

export type InquiryActionResult = { ok: true } | { ok: false; message: string };

const inquiryResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});

const FALLBACK_MESSAGE = "Unable to send your message right now. Please try again.";

/** Sends the Get In Touch popup or contact form to `POST /inquiries` (public, no token). */
export async function submitInquiryAction(input: InquiryInput): Promise<InquiryActionResult> {
  const parsed = inquirySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Please check your details and try again." };
  }

  try {
    const response = await apiPost("/inquiries", parsed.data, inquiryResponseSchema, { timeoutMs: 20_000 });
    return response.success ? { ok: true } : { ok: false, message: response.message || FALLBACK_MESSAGE };
  } catch (error) {
    // Show the API's own reason for a rejected inquiry (e.g. a validation message).
    if (isApiError(error) && error.status < 500 && error.message !== "The request failed") {
      return { ok: false, message: error.message };
    }
    return { ok: false, message: FALLBACK_MESSAGE };
  }
}
