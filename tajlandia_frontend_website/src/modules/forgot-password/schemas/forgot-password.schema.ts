import { z } from "zod";

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  termsAccepted: z.boolean().refine((accepted) => accepted, {
    message: "You must agree to the Terms of Service and Privacy Policy",
  }),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
