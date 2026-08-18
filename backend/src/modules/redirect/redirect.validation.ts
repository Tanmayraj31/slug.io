import { z } from "zod";

export const shortCodeParamsSchema = z.object({
  shortCode: z.string().min(5).max(16),
});

export type ShortCodeParams = z.infer<typeof shortCodeParamsSchema>;
