import { useCallback, useEffect, useRef, useState } from "react";
import type { LinkResponseDto, LinkStatus } from "@/types/api";
import { listLinks } from "@/api/links";
import { ApiClientError } from "@/api/client";

const PAGE_SIZE = 10;

export type StatusFilter = "ALL" | LinkStatus;

interface UseLinksOptions {
  pageSize?: number;
}

interface UseLinksResult {
  links: LinkResponseDto[];
  total: number;
  totalPages: number;
  page: number;
  pageSize: number;
  status: StatusFilter;
  loading: boolean;
  error: string | null;
  setPage: (page: number) => void;
  setStatus: (status: StatusFilter) => void;
  refresh: () => Promise<void>;
}

export function useLinks(options: UseLinksOptions = {}): UseLinksResult {
  const { pageSize = PAGE_SIZE } = options;

  const [links, setLinks] = useState<LinkResponseDto[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listLinks({
        page,
        pageSize,
        status: status === "ALL" ? undefined : status,
      });
      if (!mountedRef.current) {
        return;
      }
      setLinks(result.links);
      setTotal(result.total);
      setTotalPages(result.totalPages);
      setPage(result.page);
    } catch (err) {
      if (!mountedRef.current) {
        return;
      }
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError("Something went wrong loading your links.");
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [page, pageSize, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const changeStatus = useCallback(
    (next: StatusFilter) => {
      setStatus(next);
      setPage(1);
    },
    [],
  );

  const refresh = useCallback(async () => {
    await load();
  }, [load]);

  return {
    links,
    total,
    totalPages,
    page,
    pageSize,
    status,
    loading,
    error,
    setPage,
    setStatus: changeStatus,
    refresh,
  };
}
