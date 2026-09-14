import { z } from "zod";

const signupFieldsSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  newPassword: z.string().min(1, "New password is required"),
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
