import { z } from "zod";
import { LinkStatus } from "../../generated/prisma/enums.js";

export const createLinkSchema = z.object({
  originalUrl: z.string().trim().min(1).max(2048),
  expiresAt: z.string().datetime({ offset: true }).optional(),
});

export const listLinkQuerySchema = z.object({
  status: z.nativeEnum(LinkStatus).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20), 
});


export const getLinkParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export const updateLinkStatusSchema = z.object({
  status: z.enum([LinkStatus.ACTIVE, LinkStatus.DISABLED]),
});


export type CreateLinkInput = z.infer<typeof createLinkSchema>;
export type ListLinkQuery = z.infer<typeof listLinkQuerySchema>;
export type GetLinkQuery = z.infer<typeof getLinkParamsSchema>;
export type UpdateLinkStatusInput = z.infer<typeof updateLinkStatusSchema>;