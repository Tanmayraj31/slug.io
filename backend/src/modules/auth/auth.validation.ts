import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  password: z.string().min(8).max(72),
  username: z.string().trim().min(1).max(50).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
