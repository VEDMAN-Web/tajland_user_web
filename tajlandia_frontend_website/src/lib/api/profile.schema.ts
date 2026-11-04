import { z } from "zod";

// `GET /auth/me` and `PUT /auth/edit-profile` `data`: the signed-in user.
// There is no sign-up date yet, so "Member since" stays empty until one is sent.
export const authProfileSchema = z.object({
  id: z.string().min(1),
  firstName: z.string().nullish(),
  lastName: z.string().nullish(),
  email: z.string(),
  mobileNumber: z.string().nullish(),
  // Absolute URL from `/auth/me`; `edit-profile` sends a "/uploads/..." path,
  // which the edit route resolves against the backend host.
  profileImage: z.string().nullish(),
  role: z.string().nullish(),
  isActive: z.boolean().nullish(),
  isEmailVerified: z.boolean().nullish(),
  lastLoginAt: z.string().nullish(),
  createdAt: z.string().nullish(),
});

export type AuthProfile = z.infer<typeof authProfileSchema>;

// Backend rules for `PUT /auth/edit-profile` (multipart form fields).
export const PROFILE_NAME_PATTERN = /^[\p{L}\s]+$/u;
export const PROFILE_MOBILE_PATTERN = /^\+?\d{10,15}$/;
export const PROFILE_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const PROFILE_IMAGE_MAX_BYTES = 2 * 1024 * 1024;

export type ProfileField = "firstName" | "lastName" | "mobileNumber" | "profileImage";
