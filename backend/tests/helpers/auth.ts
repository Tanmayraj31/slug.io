import type { Express } from "express";
import request from "supertest";

export interface AuthResult {
  accessToken: string;
  cookie: string;
  user: { id: number; email: string; username: string | null; createdAt: string };
}

export function authHeader(accessToken: string): Record<string, string> {
  return { Authorization: `Bearer ${accessToken}` };
}

export async function registerAndLogin(
  app: Express,
  overrides: { email?: string; password?: string } = {}
): Promise<AuthResult> {
  const email = overrides.email ?? `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  const password = overrides.password ?? "testpassword123";

  const registerRes = await request(app)
    .post("/api/v1/auth/register")
    .send({ email, password });

  if (registerRes.status !== 201) {
    throw new Error(`register failed: ${registerRes.status} ${JSON.stringify(registerRes.body)}`);
  }

  const loginRes = await request(app)
    .post("/api/v1/auth/login")
    .send({ email, password });

  if (loginRes.status !== 200) {
    throw new Error(`login failed: ${loginRes.status} ${JSON.stringify(loginRes.body)}`);
  }

  const setCookie = loginRes.headers["set-cookie"] as string[] | undefined;
  const cookie = setCookie
    ? setCookie.map((c) => c.split(";")[0]!).join("; ")
    : "";

  return {
    accessToken: loginRes.body.accessToken as string,
    cookie,
    user: loginRes.body.user as AuthResult["user"],
  };
}
