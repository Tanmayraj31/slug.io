import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { useLinks } from "./useLinks";
import { ApiClientError } from "@/api/client";
import type { LinkListResponseDto, LinkResponseDto } from "@/types/api";

vi.mock("@/api/links", () => ({
  listLinks: vi.fn(),
}));

import { listLinks } from "@/api/links";

const mockedListLinks = vi.mocked(listLinks);

function makeLink(overrides: Partial<LinkResponseDto> = {}): LinkResponseDto {
  return {
    id: 1,
    originalUrl: "https://example.com",
    shortCode: "abc123",
    status: "ACTIVE",
    isCustom: false,
    totalClicks: 5,
    expiresAt: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    shortUrl: "http://localhost:3000/abc123",
    ...overrides,
  };
}

function listResponse(overrides: Partial<LinkListResponseDto> = {}): LinkListResponseDto {
  return {
    links: [makeLink()],
    page: 1,
    pageSize: 10,
    total: 1,
    totalPages: 1,
    ...overrides,
  };
}

const wrapper = ({ children }: { children: ReactNode }) => children as ReactNode;

beforeEach(() => {
  mockedListLinks.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("useLinks", () => {
  it("fetches links on mount and exposes the list", async () => {
    mockedListLinks.mockResolvedValue(listResponse({ total: 1, totalPages: 1 }));

    const { result } = renderHook(() => useLinks(), { wrapper });

    await waitFor(() => expect(result.current.links).toHaveLength(1));
    expect(result.current.total).toBe(1);
    expect(result.current.totalPages).toBe(1);
    expect(result.current.loading).toBe(false);
    expect(mockedListLinks).toHaveBeenCalledWith({ page: 1, pageSize: 10, status: undefined });
  });

  it("resets to page 1 and refetches when the filter changes", async () => {
    mockedListLinks.mockResolvedValue(listResponse({ total: 20, totalPages: 2, page: 1 }));

    const { result } = renderHook(() => useLinks());
    await waitFor(() => expect(mockedListLinks).toHaveBeenCalledTimes(1));

    act(() => result.current.setPage(2));
    await waitFor(() => expect(mockedListLinks).toHaveBeenCalledWith({ page: 2, pageSize: 10, status: undefined }));

    act(() => result.current.setStatus("DISABLED"));
    await waitFor(() =>
      expect(mockedListLinks).toHaveBeenCalledWith({ page: 1, pageSize: 10, status: "DISABLED" }),
    );
    await waitFor(() => expect(result.current.page).toBe(1));
  });

  it("exposes error message when the request fails with an API error", async () => {
    mockedListLinks.mockRejectedValue(
      new ApiClientError(429, "PLAN_LIMIT_REACHED", "Rate limited"),
    );

    const { result } = renderHook(() => useLinks());
    await waitFor(() => expect(result.current.error).toBe("Rate limited"));

    expect(result.current.loading).toBe(false);
  });

  it("refresh() refetches the current page", async () => {
    mockedListLinks.mockResolvedValue(listResponse());

    const { result } = renderHook(() => useLinks());
    await waitFor(() => expect(mockedListLinks).toHaveBeenCalledTimes(1));

    await act(async () => {
      await result.current.refresh();
    });

    expect(mockedListLinks).toHaveBeenCalledTimes(2);
  });
});
