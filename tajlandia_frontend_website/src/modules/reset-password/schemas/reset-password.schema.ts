import { z } from "zod";
import { strongPasswordSchema } from "@/lib/validation/password";

export const resetPasswordSchema = z
  .object({
    newPassword: strongPasswordSchema,
    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .superRefine((values, context) => {
    if (values.newPassword && values.confirmPassword && values.newPassword !== values.confirmPassword) {
      context.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords do not match",
      });
    }
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
