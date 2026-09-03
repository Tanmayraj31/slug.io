import { useCallback, useEffect, useRef, useState } from "react";
import type { AnalyticsResponseDto, LinkResponseDto, LinkStatus } from "@/types/api";
import { deleteLink, getLink, getLinkAnalytics, updateLinkStatus } from "@/api/links";
import { ApiClientError } from "@/api/client";

interface UseLinkDetailResult {
  link: LinkResponseDto | null;
  analytics: AnalyticsResponseDto | null;
  loading: boolean;
  notFound: boolean;
  error: string | null;
  featureUnavailable: boolean;
  actionLoading: boolean;
  disable: () => Promise<void>;
  enable: () => Promise<void>;
  remove: () => Promise<void>;
  removed: boolean;
}

export function useLinkDetail(id: number): UseLinkDetailResult {
  const [link, setLink] = useState<LinkResponseDto | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [featureUnavailable, setFeatureUnavailable] = useState(false);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setNotFound(false);
      setFeatureUnavailable(false);
      try {
        const [linkData, analyticsData] = await Promise.all([
          getLink(id),
          getLinkAnalytics(id),
        ]);
        if (mountedRef.current && !cancelled) {
          setLink(linkData);
          setAnalytics(analyticsData);
        }
      } catch (err) {
        if (mountedRef.current && !cancelled) {
          if (err instanceof ApiClientError && err.status === 404) {
            setNotFound(true);
          } else if (err instanceof ApiClientError && err.code === "FEATURE_NOT_AVAILABLE") {
            setFeatureUnavailable(true);
          } else if (err instanceof ApiClientError) {
            setError(err.message);
          } else {
            setError("Something went wrong loading this link.");
          }
        }
      } finally {
        if (mountedRef.current && !cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const changeStatus = useCallback(
    async (nextStatus: Exclude<LinkStatus, "DELETED">) => {
      setActionLoading(true);
      try {
        const updated = await updateLinkStatus(id, nextStatus);
        if (mountedRef.current) {
          setLink(updated);
        }
      } catch (err) {
        if (mountedRef.current) {
          if (err instanceof ApiClientError) {
            setError(err.message);
          } else {
            setError("Something went wrong.");
          }
        }
      } finally {
        if (mountedRef.current) {
          setActionLoading(false);
        }
      }
    },
    [id],
  );

  const disable = useCallback(() => changeStatus("DISABLED"), [changeStatus]);
  const enable = useCallback(() => changeStatus("ACTIVE"), [changeStatus]);

  const remove = useCallback(async () => {
    setActionLoading(true);
    try {
      await deleteLink(id);
      if (mountedRef.current) {
        setRemoved(true);
      }
    } catch (err) {
      if (mountedRef.current) {
        if (err instanceof ApiClientError) {
          setError(err.message);
        } else {
          setError("Something went wrong deleting this link.");
        }
      }
    } finally {
      if (mountedRef.current) {
        setActionLoading(false);
      }
    }
  }, [id]);

  return {
    link,
    analytics,
    loading,
    notFound,
    error,
    featureUnavailable,
    actionLoading,
    disable,
    enable,
    remove,
    removed,
  };
}
