import { z } from "zod";

export const otpSchema = z
  .string()
  .length(6, "Enter the complete 6-digit code")
  .regex(/^\d{6}$/, "OTP must contain only 6 digits");

