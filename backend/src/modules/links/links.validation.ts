import { z } from "zod";

export const createLinkSchema = z.object({
  originalUrl: z.string().trim().min(1).max(2048),
  expiresAt: z.string().datetime({ offset: true }).optional(),
});

export type CreateLinkInput = z.infer<typeof createLinkSchema>;
