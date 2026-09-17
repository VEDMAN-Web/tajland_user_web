import { z } from "zod";

export const authResponseBaseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const loginResponseSchema = authResponseBaseSchema.extend({
  data: z
    .object({
      accessToken: z.string(),
      refreshToken: z.string().optional(),
      user: z.object({
        id: z.string(),
        email: z.string().email(),
        name: z.string().optional(),
        role: z.string().optional(),
        isActive: z.boolean().optional(),
        isEmailVerified: z.boolean().optional(),
        lastLoginAt: z.string().optional(),
      }),
    })
    .optional(),
});

export type LoginResponse = z.infer<typeof loginResponseSchema>;

export const registerResponseSchema = authResponseBaseSchema.extend({
  data: z
    .object({
      id: z.string(),
      email: z.string().email(),
      name: z.string(),
      role: z.string().optional(),
      isActive: z.boolean().optional(),
      isEmailVerified: z.boolean().optional(),
    })
    .optional(),
});

export type RegisterResponse = z.infer<typeof registerResponseSchema>;

export const requestOtpResponseSchema = authResponseBaseSchema;

export type RequestOtpResponse = z.infer<typeof requestOtpResponseSchema>;

export const verifyOtpResponseSchema = authResponseBaseSchema.extend({
  data: z
    .object({
      accessToken: z.string().optional(),
      refreshToken: z.string().optional(),
      user: z
        .object({
          id: z.string(),
          email: z.string().email(),
          name: z.string().optional(),
          role: z.string().optional(),
          isActive: z.boolean().optional(),
          isEmailVerified: z.boolean().optional(),
          lastLoginAt: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
});

export type VerifyOtpResponse = z.infer<typeof verifyOtpResponseSchema>;

export const resendOtpResponseSchema = authResponseBaseSchema;

export type ResendOtpResponse = z.infer<typeof resendOtpResponseSchema>;

export const resetPasswordResponseSchema = authResponseBaseSchema.extend({
  data: z
    .object({
      email: z.string(),
    })
    .optional(),
});

export type ResetPasswordResponse = z.infer<typeof resetPasswordResponseSchema>;
