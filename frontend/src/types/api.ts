export type LinkStatus = "ACTIVE" | "DISABLED" | "DELETED";

export interface AuthUserDto {
  id: number;
  email: string;
  username: string | null;
  createdAt: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  username?: string;
}

export interface AuthSuccessDto {
  accessToken: string;
  user: AuthUserDto;
}

export interface LinkResponseDto {
  id: number;
  originalUrl: string;
  shortCode: string;
  status: LinkStatus;
  isCustom: boolean;
  totalClicks: number;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  shortUrl: string;
}

export interface LinkListResponseDto {
  links: LinkResponseDto[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface CreateLinkInput {
  originalUrl: string;
  expiresAt?: string;
}

export interface ListLinksQuery {
  status?: LinkStatus;
  page?: number;
  pageSize?: number;
}
