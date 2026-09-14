import { z } from "zod";

const strongPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/\d/, "Password must contain a number")
  .regex(/[!@#$%^&*(),.?":{}|<>[\]\\/~`_+;='-]/, "Password must contain a special character");

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
