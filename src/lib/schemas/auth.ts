import { z } from "zod";

export const signUpSchema = z.object({
  email: z.string().min(1).email(),
  password: z.string().min(8),
  displayName: z.string().min(1).max(50),
  familyName: z.string().min(1).max(80),
});

export const loginSchema = z.object({
  email: z.string().min(1).email(),
  password: z.string().min(1),
});

export const childLoginSchema = z.object({
  familyCode: z.string().length(6),
  profileId: z.string().uuid(),
  pin: z.string().min(4).max(6).regex(/^\d+$/),
});

export const createChildSchema = z.object({
  displayName: z.string().min(1).max(50),
  emoji: z.string().min(1),
  pin: z.string().min(4).max(6).regex(/^\d+$/, "El PIN debe ser numérico"),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChildLoginInput = z.infer<typeof childLoginSchema>;
export type CreateChildInput = z.infer<typeof createChildSchema>;
