import { z } from "zod";

export const createLinkSchema = z.object({
  originalUrl: z.string().trim().min(1).max(2048),
});

export type CreateLinkInput = z.infer<typeof createLinkSchema>;
