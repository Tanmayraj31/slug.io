import type {
  CreateLinkInput,
  LinkListResponseDto,
  LinkResponseDto,
  ListLinksQuery,
} from "@/types/api";
import { apiGet, apiPost } from "./client";

export async function createLink(input: CreateLinkInput): Promise<LinkResponseDto> {
  const { link } = await apiPost<{ link: LinkResponseDto }>("/api/links", input);
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
  return apiGet<LinkListResponseDto>(queryString ? `/api/links?${queryString}` : "/api/links");
}
