import { z } from "zod";
import { findCountry } from "@/lib/phone/countries";

export const editProfileSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required").min(2, "First name must be at least 2 characters"),
    lastName: z.string().trim().min(1, "Last name is required").min(2, "Last name must be at least 2 characters"),
    email: z.string().trim().min(1, "Email is required").email("Please enter a valid email address"),
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

export type EditProfileErrors = Partial<Record<"firstName" | "lastName" | "email" | "phone" | "termsAccepted", string>>;
