import type {
  AnalyticsResponseDto,
  CreateLinkInput,
  LinkListResponseDto,
  LinkResponseDto,
  LinkStatus,
  ListLinksQuery,
} from "@/types/api";
import { apiDelete, apiGet, apiPatch, apiPost } from "./client";

export async function createLink(input: CreateLinkInput): Promise<LinkResponseDto> {
  const { link } = await apiPost<{ link: LinkResponseDto }>("/api/v1/links", input);
  return link;
}

export async function listLinks(query: ListLinksQuery = {}): Promise<LinkListResponseDto> {
  const params = new URLSearchParams();
  if (query.status !== undefined) {
    params.set("status", query.status);
  }
  if (query.page !== undefined) {
    params.set("page", String(query.page));
  }
  if (query.pageSize !== undefined) {
    params.set("pageSize", String(query.pageSize));
  }

  const queryString = params.toString();
  return apiGet<LinkListResponseDto>(queryString ? `/api/v1/links?${queryString}` : "/api/v1/links");
}

export async function getLink(id: number): Promise<LinkResponseDto> {
  const { link } = await apiGet<{ link: LinkResponseDto }>(`/api/v1/links/${id}`);
  return link;
}

export async function updateLinkStatus(
  id: number,
  status: Exclude<LinkStatus, "DELETED">,
): Promise<LinkResponseDto> {
  const { link } = await apiPatch<{ link: LinkResponseDto }>(`/api/v1/links/${id}/status`, {
    status,
  });
  return link;
}

export async function deleteLink(id: number): Promise<void> {
  await apiDelete<void>(`/api/v1/links/${id}`);
}

export async function getLinkAnalytics(id: number): Promise<AnalyticsResponseDto> {
  return apiGet<AnalyticsResponseDto>(`/api/v1/links/${id}/analytics`);
}
