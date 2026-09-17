import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[0-9]/, "Password must contain a number")
  .regex(/[!@#$%^&*(),.?":{}|<>[\]\\/~`_+;='-]/, "Password must contain a special character (!@#$%^&*...)");

const signupFieldsSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").min(2, "First name must be at least 2 characters"),
  lastName: z.string().trim().min(1, "Last name is required").min(2, "Last name must be at least 2 characters"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, "Confirm password is required"),
  termsAccepted: z.boolean().refine((accepted) => accepted, {
    message: "You must agree to the Terms of Service and Privacy Policy",
  }),
});

export const signupSchema = signupFieldsSchema.superRefine((values, context) => {
  if (values.newPassword && values.confirmPassword && values.newPassword !== values.confirmPassword) {
    context.addIssue({
      code: "custom",
      path: ["confirmPassword"],
      message: "Passwords do not match",
    });
  }
});

export type SignupFormValues = z.infer<typeof signupSchema>;
