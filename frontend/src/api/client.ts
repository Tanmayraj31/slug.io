import type { AuthSuccessDto } from "@/types/api";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
  }
}

let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string): void {
  accessToken = token;
}

export function clearAccessToken(): void {
  accessToken = null;
}

const REFRESH_EXEMPT_PATHS = new Set([
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/refresh",
]);

let refreshInFlight: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (!refreshInFlight) {
    refreshInFlight = requestRaw<AuthSuccessDto>("POST", "/api/auth/refresh")
      .then((body) => {
        accessToken = body.accessToken;
        return body.accessToken;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

function buildInit(method: string, body: unknown, token: string | null): RequestInit {
  const headers = new Headers();
  if (body !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  if (token !== null) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return {
    method,
    headers,
    credentials: "include",
    body: body === undefined ? undefined : JSON.stringify(body),
  };
}

async function send(path: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(`${BASE_URL}${path}`, init);
  } catch {
    throw new ApiClientError(0, "NETWORK_ERROR", "Unable to reach the server.");
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new ApiClientError(
      response.status,
      "INVALID_RESPONSE",
      "Server returned an unexpected payload.",
    );
  }

  if (!response.ok) {
    const envelope = payload as { error?: { code?: string; message?: string } };
    throw new ApiClientError(
      response.status,
      envelope.error?.code ?? "UNKNOWN_ERROR",
      envelope.error?.message ?? "Something went wrong.",
    );
  }

  return payload as T;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const response = await send(path, buildInit(method, body, accessToken));

  if (response.status === 401 && !REFRESH_EXEMPT_PATHS.has(path)) {
    try {
      await refreshAccessToken();
    } catch (error) {
      clearAccessToken();
      window.dispatchEvent(new Event("session-expired"));
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError(401, "SESSION_EXPIRED", "Your session has expired. Please log in again.");
    }

    const retried = await send(path, buildInit(method, body, accessToken));
    return parseResponse<T>(retried);
  }

  return parseResponse<T>(response);
}

async function requestRaw<T>(method: string, path: string, body?: unknown): Promise<T> {
  const response = await send(path, buildInit(method, body, accessToken));
  return parseResponse<T>(response);
}

export function apiGet<T>(path: string): Promise<T> {
  return request<T>("GET", path);
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return request<T>("POST", path, body);
}

export function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  return request<T>("PATCH", path, body);
}

export function apiDelete<T>(path: string): Promise<T> {
  return request<T>("DELETE", path);
}
