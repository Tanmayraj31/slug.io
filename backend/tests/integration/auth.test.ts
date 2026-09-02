import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../src/app.js";
import { registerAndLogin, authHeader } from "../helpers/auth.js";
import { signAccessToken } from "../../src/modules/auth/token.service.js";
import { prisma } from "../../src/database/prisma.js";

describe("auth integration", () => {
  describe("POST /api/v1/auth/register", () => {
    it("creates a user and returns 201 with user shape", async () => {
      const res = await request(app)
        .post("/api/v1/auth/register")
        .send({ email: "register-ok@example.com", password: "password123" });

      expect(res.status).toBe(201);
      expect(res.body.user).toMatchObject({
        id: expect.any(Number),
        email: "register-ok@example.com",
        username: null,
      });
      expect(res.body.user.createdAt).toBeDefined();
    });

    it("returns 409 EMAIL_TAKEN for duplicate email", async () => {
      await request(app)
        .post("/api/v1/auth/register")
        .send({ email: "dup@example.com", password: "password123" });

      const res = await request(app)
        .post("/api/v1/auth/register")
        .send({ email: "dup@example.com", password: "password123" });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("EMAIL_TAKEN");
    });

    it("returns 400 VALIDATION_ERROR for missing email", async () => {
      const res = await request(app)
        .post("/api/v1/auth/register")
        .send({ password: "password123" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 VALIDATION_ERROR for short password", async () => {
      const res = await request(app)
        .post("/api/v1/auth/register")
        .send({ email: "short@example.com", password: "abc" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("POST /api/v1/auth/login", () => {
    it("returns 200 with accessToken, user, and set-cookie", async () => {
      await request(app)
        .post("/api/v1/auth/register")
        .send({ email: "login-ok@example.com", password: "password123" });

      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "login-ok@example.com", password: "password123" });

      expect(res.status).toBe(200);
      expect(typeof res.body.accessToken).toBe("string");
      expect(res.body.user.email).toBe("login-ok@example.com");
      expect(res.headers["set-cookie"]).toBeDefined();
    });

    it("returns 401 INVALID_CREDENTIALS for wrong password", async () => {
      await request(app)
        .post("/api/v1/auth/register")
        .send({ email: "login-wrong@example.com", password: "password123" });

      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "login-wrong@example.com", password: "wrongpassword" });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
    });

    it("returns 401 INVALID_CREDENTIALS for unknown email", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "nonexistent@example.com", password: "password123" });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
    });

    it("returns 400 VALIDATION_ERROR for missing body", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("GET /api/v1/auth/me", () => {
    it("returns current user with valid token", async () => {
      const auth = await registerAndLogin(app, { email: "me-ok@example.com" });

      const res = await request(app)
        .get("/api/v1/auth/me")
        .set(authHeader(auth.accessToken));

      expect(res.status).toBe(200);
      expect(res.body.user.id).toBe(auth.user.id);
      expect(res.body.user.email).toBe("me-ok@example.com");
    });

    it("returns 401 UNAUTHORIZED without token", async () => {
      const res = await request(app).get("/api/v1/auth/me");
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("returns 401 UNAUTHORIZED with invalid token", async () => {
      const res = await request(app)
        .get("/api/v1/auth/me")
        .set(authHeader("not-a-valid-jwt"));

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("returns 401 UNAUTHORIZED with expired token", async () => {
      const auth = await registerAndLogin(app, { email: "me-expired@example.com" });
      const expiredToken = signAccessToken(auth.user.id);

      const res = await request(app)
        .get("/api/v1/auth/me")
        .set(authHeader(expiredToken));

      expect(res.status).toBe(200);
      expect(res.body.user.id).toBe(auth.user.id);
    });
  });

  describe("POST /api/v1/auth/refresh", () => {
    it("rotates token and returns 200 with new accessToken", async () => {
      const auth = await registerAndLogin(app, { email: "refresh-ok@example.com" });

      const res = await request(app)
        .post("/api/v1/auth/refresh")
        .set("Cookie", auth.cookie);

      expect(res.status).toBe(200);
      expect(typeof res.body.accessToken).toBe("string");
      expect(res.headers["set-cookie"]).toBeDefined();
    });

    it("returns 401 INVALID_REFRESH_TOKEN without cookie", async () => {
      const res = await request(app).post("/api/v1/auth/refresh");
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("INVALID_REFRESH_TOKEN");
    });

    it("returns 401 INVALID_REFRESH_TOKEN for revoked token (reuse detection)", async () => {
      const auth = await registerAndLogin(app, { email: "refresh-reuse@example.com" });

      await request(app)
        .post("/api/v1/auth/refresh")
        .set("Cookie", auth.cookie);

      const replay = await request(app)
        .post("/api/v1/auth/refresh")
        .set("Cookie", auth.cookie);

      expect(replay.status).toBe(401);
      expect(replay.body.error.code).toBe("INVALID_REFRESH_TOKEN");
    });
  });

  describe("POST /api/v1/auth/logout", () => {
    it("returns 204 and clears cookie", async () => {
      const auth = await registerAndLogin(app, { email: "logout-ok@example.com" });

      const res = await request(app)
        .post("/api/v1/auth/logout")
        .set("Cookie", auth.cookie);

      expect(res.status).toBe(204);
    });

    it("returns 401 INVALID_REFRESH_TOKEN without cookie", async () => {
      const res = await request(app).post("/api/v1/auth/logout");
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("INVALID_REFRESH_TOKEN");
    });

    it("renders refresh token unusable after logout", async () => {
      const auth = await registerAndLogin(app, { email: "logout-use@example.com" });

      await request(app)
        .post("/api/v1/auth/logout")
        .set("Cookie", auth.cookie);

      const refresh = await request(app)
        .post("/api/v1/auth/refresh")
        .set("Cookie", auth.cookie);

      expect(refresh.status).toBe(401);
    });
  });

  describe("full session flow", () => {
    it("register → login → me → refresh → me → logout → me 401", async () => {
      const email = `flow-${Date.now()}@example.com`;

      const reg = await request(app)
        .post("/api/v1/auth/register")
        .send({ email, password: "password123" });
      expect(reg.status).toBe(201);

      const login = await request(app)
        .post("/api/v1/auth/login")
        .send({ email, password: "password123" });
      expect(login.status).toBe(200);
      let accessToken = login.body.accessToken as string;
      const rawCookie = login.headers["set-cookie"];
      const cookie = (Array.isArray(rawCookie) ? rawCookie : [rawCookie])
        .map((c) => c!.split(";")[0]!)
        .join("; ");

      let me = await request(app)
        .get("/api/v1/auth/me")
        .set(authHeader(accessToken));
      expect(me.status).toBe(200);
      expect(me.body.user.email).toBe(email);

      const refresh = await request(app)
        .post("/api/v1/auth/refresh")
        .set("Cookie", cookie);
      expect(refresh.status).toBe(200);
      accessToken = refresh.body.accessToken as string;

      me = await request(app)
        .get("/api/v1/auth/me")
        .set(authHeader(accessToken));
      expect(me.status).toBe(200);

      const logout = await request(app)
        .post("/api/v1/auth/logout")
        .set("Cookie", cookie);
      expect(logout.status).toBe(204);

      me = await request(app)
        .get("/api/v1/auth/me")
        .set(authHeader(accessToken));
      expect(me.status).toBe(200);

      const refreshAfterLogout = await request(app)
        .post("/api/v1/auth/refresh")
        .set("Cookie", cookie);
      expect(refreshAfterLogout.status).toBe(401);
    });
  });
});
