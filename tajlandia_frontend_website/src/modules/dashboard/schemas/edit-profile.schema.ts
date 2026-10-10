import { z } from "zod";
import { PROFILE_NAME_PATTERN } from "@/lib/api/profile.schema";
import { findCountry } from "@/lib/phone/countries";

// Same rules as `PUT /auth/edit-profile`: letters and spaces, 2-50 characters.
// Email can't be changed there, so it isn't part of the form.
export const editProfileSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(1, "First name is required")
      .min(2, "First name must be at least 2 characters")
      .max(50, "First name must be 50 characters or fewer")
      .regex(PROFILE_NAME_PATTERN, "Use letters and spaces only"),
    lastName: z
      .string()
      .trim()
      .min(1, "Last name is required")
      .min(2, "Last name must be at least 2 characters")
      .max(50, "Last name must be 50 characters or fewer")
      .regex(PROFILE_NAME_PATTERN, "Use letters and spaces only"),
    countryCode: z.string(),
    phone: z.string(),
    termsAccepted: z.boolean().refine((accepted) => accepted, {
      message: "You must agree to the Terms of Service and Privacy Policy",
    }),
  })
  .superRefine((values, context) => {
    const country = findCountry(values.countryCode);
    if (!values.phone.trim()) {
      context.addIssue({ code: "custom", path: ["phone"], message: "Phone number is required" });
      return;
    }
    if (values.phone.length !== country.digits) {
      context.addIssue({
        code: "custom",
        path: ["phone"],
        message: `Enter a ${country.digits}-digit phone number`,
      });
    }
  });

export type EditProfileErrors = Partial<Record<"firstName" | "lastName" | "phone" | "termsAccepted", string>>;
