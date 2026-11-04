import { z } from "zod";

// `POST /inquiries` rules (Swagger). Names: letters, spaces, hyphens and apostrophes.
export const INQUIRY_NAME_PATTERN = /^[\p{L}][\p{L}\s'-]*$/u;
export const INQUIRY_NAME_MIN = 2;
export const INQUIRY_NAME_MAX = 50;
export const INQUIRY_EMAIL_MAX = 150;
export const INQUIRY_MESSAGE_MAX = 2000;
// Stricter than the API's 5 characters, so a message says something useful.
export const INQUIRY_MESSAGE_MIN_LETTERS = 20;

const nameSchema = z.string().trim().min(INQUIRY_NAME_MIN).max(INQUIRY_NAME_MAX).regex(INQUIRY_NAME_PATTERN);

export const inquirySchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: z.string().trim().email().max(INQUIRY_EMAIL_MAX),
  // Optional; dial code + national number, e.g. "+919876543210".
  phoneNumber: z.string().regex(/^\+?\d{10,15}$/).optional(),
  message: z.string().trim().min(5).max(INQUIRY_MESSAGE_MAX),
});

export type InquiryInput = z.infer<typeof inquirySchema>;

/** First problem with a name field, or null. Shared by the popup and the contact page. */
export function inquiryNameError(value: string, label: string): string | null {
  const name = value.trim();
  if (!name) return `${label} is required.`;
  if (name.length < INQUIRY_NAME_MIN) return `${label} must be at least ${INQUIRY_NAME_MIN} characters.`;
  if (name.length > INQUIRY_NAME_MAX) return `${label} must be at most ${INQUIRY_NAME_MAX} characters.`;
  if (!INQUIRY_NAME_PATTERN.test(name)) return `${label} can contain letters, spaces, hyphens and apostrophes only.`;
  return null;
}

/** First problem with the message, or null. */
export function inquiryMessageError(value: string): string | null {
  if (!value.trim()) return "Message is required.";
  if (value.replace(/[^\p{L}]/gu, "").length < INQUIRY_MESSAGE_MIN_LETTERS) {
    return `Please enter at least ${INQUIRY_MESSAGE_MIN_LETTERS} letters in your message.`;
  }
  if (value.trim().length > INQUIRY_MESSAGE_MAX) return `Message must be at most ${INQUIRY_MESSAGE_MAX} characters.`;
  return null;
}
