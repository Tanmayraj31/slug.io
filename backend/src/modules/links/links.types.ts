import type { LinkStatus } from "../../generated/prisma/client.js";

export interface LinkResponseDto {
  id: number;
  originalUrl: string;
  shortCode: string;
  status: LinkStatus;
  isCustom: boolean;
  totalClicks: number;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  shortUrl: string;
}

export interface LinkListResponseDto {
  links: LinkResponseDto[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}


