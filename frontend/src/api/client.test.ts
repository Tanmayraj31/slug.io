import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  ApiClientError,
  clearAccessToken,
  setAccessToken,
} from "./client";
import type { AuthSuccessDto } from "@/types/api";

const BASE_URL = "";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function installFetch(impl: typeof fetch) {
  vi.stubGlobal("fetch", impl);
}

beforeEach(() => {
  clearAccessToken();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

afterEach(() => {
  clearAccessToken();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("api client", () => {
  it("attaches the bearer token and parses a successful response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    installFetch(fetchMock);
    setAccessToken("abc");

    const result = await apiGet<{ ok: boolean }>("/api/v1/links");

    expect(result).toEqual({ ok: true });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE_URL}/api/v1/links`);
    expect(new Headers(init.headers).get("Authorization")).toBe("Bearer abc");
  });

  it("throws ApiClientError with code and message on an error envelope", async () => {
    installFetch(() =>
      Promise.resolve(
        jsonResponse({ error: { code: "LINK_NOT_FOUND", message: "Link not found" } }, 404),
      ),
    );

    const error = await apiGet<never>("/api/v1/links/1").catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiClientError);
    expect(error).toMatchObject({ status: 404, code: "LINK_NOT_FOUND", message: "Link not found" });
  });

  it("parses VALIDATION_ERROR field details", async () => {
    installFetch(() =>
      Promise.resolve(
        jsonResponse(
          { error: { code: "VALIDATION_ERROR", message: "Invalid input", details: { email: "Bad email" } } },
          400,
        ),
      ),
    );

    const error = await apiPost<never>("/api/v1/auth/login", {}).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiClientError);
    expect((error as ApiClientError).details).toEqual({ email: "Bad email" });
  });

  it("returns 204 responses as undefined", async () => {
    installFetch(() => Promise.resolve(new Response(null, { status: 204 })));

    const result = await apiDelete<void>("/api/v1/links/1");

    expect(result).toBeUndefined();
  });

  it("maps a network failure to a NETWORK_ERROR ApiClientError", async () => {
    installFetch(() => Promise.reject(new TypeError("fetch failed")));

    const error = await apiGet<never>("/api/v1/links").catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiClientError);
    expect((error as ApiClientError).code).toBe("NETWORK_ERROR");
    expect((error as ApiClientError).status).toBe(0);
  });

  it("silently refreshes the token and retries once on a 401", async () => {
    const freshToken = "fresh-token";
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ error: { code: "UNAUTHORIZED", message: "Expired" } }, 401))
      .mockImplementationOnce(() =>
        Promise.resolve(
          jsonResponse({
            accessToken: freshToken,
            user: { id: 1, email: "a@b.c", username: null, createdAt: "" },
          } as AuthSuccessDto),
        ),
      )
      .mockResolvedValueOnce(jsonResponse({ ok: true }));

    setAccessToken("stale-token");
    installFetch(fetchMock);

    const result = await apiGet<{ ok: boolean }>("/api/v1/links");

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(3);

    const refreshCall = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(refreshCall[0]).toBe(`${BASE_URL}/api/v1/auth/refresh`);

    const retriedCall = fetchMock.mock.calls[2] as [string, RequestInit];
    expect(
      new Headers(retriedCall[1].headers as HeadersInit).get("Authorization"),
    ).toBe(`Bearer ${freshToken}`);
  });

  it("avoids the refresh loop for refresh-exempt paths", async () => {
    installFetch(() =>
      Promise.resolve(jsonResponse({ error: { code: "UNAUTHORIZED", message: "Bad creds" } }, 401)),
    );

    const error = await apiPost<never>("/api/v1/auth/login", {}).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiClientError);
    expect((error as ApiClientError).code).toBe("UNAUTHORIZED");
  });

  it("dispatches session-expired and clears the token when refresh fails", async () => {
    const dispatched: string[] = [];
    const dispatchSpy = vi
      .spyOn(window, "dispatchEvent")
      .mockImplementation(((event: Event) => {
        dispatched.push(event.type);
        return true;
      }) as Window["dispatchEvent"]);

    installFetch(() =>
      Promise.resolve(jsonResponse({ error: { code: "UNAUTHORIZED", message: "Expired" } }, 401)),
    );
    setAccessToken("stale-token");

    const error = await apiGet<never>("/api/v1/links").catch((e: unknown) => e);

    expect(dispatched).toContain("session-expired");
    expect(error).toBeInstanceOf(ApiClientError);

    dispatchSpy.mockRestore();
  });
});

describe("api request helpers", () => {
  it("apiPatch sends PATCH with a JSON body", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    installFetch(fetchMock);

    await apiPatch<{ ok: boolean }>("/api/v1/links/1/status", { status: "DISABLED" });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("PATCH");
    expect(init.body).toBe(JSON.stringify({ status: "DISABLED" }));
  });

  it("apiPost sends POST with a JSON body", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    installFetch(fetchMock);

    await apiPost<{ ok: boolean }>("/api/v1/links", { url: "https://example.com" });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ url: "https://example.com" }));
  });
});
