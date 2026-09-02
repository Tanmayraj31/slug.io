import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../src/app.js";
import { registerAndLogin, authHeader } from "../helpers/auth.js";
import { prisma } from "../../src/database/prisma.js";

describe("links integration", () => {
  describe("POST /api/v1/links", () => {
    it("creates a link and returns 201 with link shape", async () => {
      const auth = await registerAndLogin(app);

      const res = await request(app)
        .post("/api/v1/links")
        .set(authHeader(auth.accessToken))
        .send({ originalUrl: "https://example.com" });

      expect(res.status).toBe(201);
      expect(res.body.link).toMatchObject({
        id: expect.any(Number),
        originalUrl: "https://example.com/",
        shortCode: expect.any(String),
        status: "ACTIVE",
        isCustom: false,
        totalClicks: 0,
        expiresAt: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        shortUrl: expect.stringContaining("/"),
      });
      expect(res.body.link.shortCode).toHaveLength(7);
    });

    it("normalizes URL (strips fragment, default port)", async () => {
      const auth = await registerAndLogin(app);

      const res = await request(app)
        .post("/api/v1/links")
        .set(authHeader(auth.accessToken))
        .send({ originalUrl: "https://example.com/path#section" });

      expect(res.status).toBe(201);
      expect(res.body.link.originalUrl).toBe("https://example.com/path");
    });

    it("returns 400 INVALID_URL for blocked URLs", async () => {
      const auth = await registerAndLogin(app);

      for (const url of [
        "ftp://example.com",
        "http://localhost",
        "http://192.168.1.1",
        "javascript:alert(1)",
      ]) {
        const res = await request(app)
          .post("/api/v1/links")
          .set(authHeader(auth.accessToken))
          .send({ originalUrl: url });

        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe("INVALID_URL");
      }
    });

    it("returns 400 VALIDATION_ERROR for missing body", async () => {
      const auth = await registerAndLogin(app);

      const res = await request(app)
        .post("/api/v1/links")
        .set(authHeader(auth.accessToken))
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 401 UNAUTHORIZED without token", async () => {
      const res = await request(app)
        .post("/api/v1/links")
        .send({ originalUrl: "https://example.com" });

      expect(res.status).toBe(401);
    });

    it("reuses existing link for duplicate destination", async () => {
      const auth = await registerAndLogin(app);

      const res1 = await request(app)
        .post("/api/v1/links")
        .set(authHeader(auth.accessToken))
        .send({ originalUrl: "https://dup.example.com" });

      const res2 = await request(app)
        .post("/api/v1/links")
        .set(authHeader(auth.accessToken))
        .send({ originalUrl: "https://dup.example.com" });

      expect(res2.status).toBe(201);
      expect(res2.body.link.id).toBe(res1.body.link.id);
      expect(res2.body.link.shortCode).toBe(res1.body.link.shortCode);
    });
  });

  describe("GET /api/v1/links", () => {
    it("returns paginated links", async () => {
      const auth = await registerAndLogin(app);

      await request(app)
        .post("/api/v1/links")
        .set(authHeader(auth.accessToken))
        .send({ originalUrl: "https://list1.example.com" });
      await request(app)
        .post("/api/v1/links")
        .set(authHeader(auth.accessToken))
        .send({ originalUrl: "https://list2.example.com" });

      const res = await request(app)
        .get("/api/v1/links")
        .set(authHeader(auth.accessToken));

      expect(res.status).toBe(200);
      expect(res.body.links).toHaveLength(2);
      expect(res.body.total).toBe(2);
      expect(res.body.page).toBe(1);
      expect(res.body.pageSize).toBe(20);
      expect(res.body.totalPages).toBe(1);
    });

    it("filters by status", async () => {
      const auth = await registerAndLogin(app);

      const createRes = await request(app)
        .post("/api/v1/links")
        .set(authHeader(auth.accessToken))
        .send({ originalUrl: "https://filter.example.com" });
      const linkId = createRes.body.link.id as number;

      await request(app)
        .patch(`/api/v1/links/${linkId}/status`)
        .set(authHeader(auth.accessToken))
        .send({ status: "DISABLED" });

      const active = await request(app)
        .get("/api/v1/links?status=ACTIVE")
        .set(authHeader(auth.accessToken));
      expect(active.body.links).toHaveLength(0);

      const disabled = await request(app)
        .get("/api/v1/links?status=DISABLED")
        .set(authHeader(auth.accessToken));
      expect(disabled.body.links).toHaveLength(1);
    });

    it("paginates with pageSize=1", async () => {
      const auth = await registerAndLogin(app);

      await request(app)
        .post("/api/v1/links")
        .set(authHeader(auth.accessToken))
        .send({ originalUrl: "https://page1.example.com" });
      await request(app)
        .post("/api/v1/links")
        .set(authHeader(auth.accessToken))
        .send({ originalUrl: "https://page2.example.com" });

      const res = await request(app)
        .get("/api/v1/links?page=1&pageSize=1")
        .set(authHeader(auth.accessToken));

      expect(res.status).toBe(200);
      expect(res.body.links).toHaveLength(1);
      expect(res.body.totalPages).toBe(2);
    });

    it("returns 400 VALIDATION_ERROR for invalid query", async () => {
      const auth = await registerAndLogin(app);

      const res = await request(app)
        .get("/api/v1/links?status=BOGUS")
        .set(authHeader(auth.accessToken));

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("GET /api/v1/links/:id", () => {
    it("returns link by id", async () => {
      const auth = await registerAndLogin(app);

      const created = await request(app)
        .post("/api/v1/links")
        .set(authHeader(auth.accessToken))
        .send({ originalUrl: "https://getbyid.example.com" });

      const res = await request(app)
        .get(`/api/v1/links/${created.body.link.id}`)
        .set(authHeader(auth.accessToken));

      expect(res.status).toBe(200);
      expect(res.body.link.id).toBe(created.body.link.id);
    });

    it("returns 404 for nonexistent link", async () => {
      const auth = await registerAndLogin(app);

      const res = await request(app)
        .get("/api/v1/links/999999")
        .set(authHeader(auth.accessToken));

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("LINK_NOT_FOUND");
    });

    it("returns 404 for other user's link", async () => {
      const user1 = await registerAndLogin(app);
      const user2 = await registerAndLogin(app);

      const created = await request(app)
        .post("/api/v1/links")
        .set(authHeader(user1.accessToken))
        .send({ originalUrl: "https://owner.example.com" });

      const res = await request(app)
        .get(`/api/v1/links/${created.body.link.id}`)
        .set(authHeader(user2.accessToken));

      expect(res.status).toBe(404);
    });

    it("returns 400 VALIDATION_ERROR for non-numeric id", async () => {
      const auth = await registerAndLogin(app);

      const res = await request(app)
        .get("/api/v1/links/abc")
        .set(authHeader(auth.accessToken));

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("PATCH /api/v1/links/:id/status", () => {
    it("disables an active link", async () => {
      const auth = await registerAndLogin(app);

      const created = await request(app)
        .post("/api/v1/links")
        .set(authHeader(auth.accessToken))
        .send({ originalUrl: "https://disable.example.com" });

      const res = await request(app)
        .patch(`/api/v1/links/${created.body.link.id}/status`)
        .set(authHeader(auth.accessToken))
        .send({ status: "DISABLED" });

      expect(res.status).toBe(200);
      expect(res.body.link.status).toBe("DISABLED");
    });

    it("reactivates a disabled link", async () => {
      const auth = await registerAndLogin(app);

      const created = await request(app)
        .post("/api/v1/links")
        .set(authHeader(auth.accessToken))
        .send({ originalUrl: "https://reactivate.example.com" });

      await request(app)
        .patch(`/api/v1/links/${created.body.link.id}/status`)
        .set(authHeader(auth.accessToken))
        .send({ status: "DISABLED" });

      const res = await request(app)
        .patch(`/api/v1/links/${created.body.link.id}/status`)
        .set(authHeader(auth.accessToken))
        .send({ status: "ACTIVE" });

      expect(res.status).toBe(200);
      expect(res.body.link.status).toBe("ACTIVE");
    });

    it("returns 404 for nonexistent link", async () => {
      const auth = await registerAndLogin(app);

      const res = await request(app)
        .patch("/api/v1/links/999999/status")
        .set(authHeader(auth.accessToken))
        .send({ status: "DISABLED" });

      expect(res.status).toBe(404);
    });

    it("returns 400 VALIDATION_ERROR for invalid status value", async () => {
      const auth = await registerAndLogin(app);

      const created = await request(app)
        .post("/api/v1/links")
        .set(authHeader(auth.accessToken))
        .send({ originalUrl: "https://invalid-status.example.com" });

      const res = await request(app)
        .patch(`/api/v1/links/${created.body.link.id}/status`)
        .set(authHeader(auth.accessToken))
        .send({ status: "DELETED" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("DELETE /api/v1/links/:id", () => {
    it("soft-deletes a link and returns 204", async () => {
      const auth = await registerAndLogin(app);

      const created = await request(app)
        .post("/api/v1/links")
        .set(authHeader(auth.accessToken))
        .send({ originalUrl: "https://delete.example.com" });

      const res = await request(app)
        .delete(`/api/v1/links/${created.body.link.id}`)
        .set(authHeader(auth.accessToken));

      expect(res.status).toBe(204);
    });

    it("deleted link returns status=DELETED via GET", async () => {
      const auth = await registerAndLogin(app);

      const created = await request(app)
        .post("/api/v1/links")
        .set(authHeader(auth.accessToken))
        .send({ originalUrl: "https://delete-gone.example.com" });

      await request(app)
        .delete(`/api/v1/links/${created.body.link.id}`)
        .set(authHeader(auth.accessToken));

      const res = await request(app)
        .get(`/api/v1/links/${created.body.link.id}`)
        .set(authHeader(auth.accessToken));

      expect(res.status).toBe(200);
      expect(res.body.link.status).toBe("DELETED");
    });

    it("returns 404 for nonexistent link", async () => {
      const auth = await registerAndLogin(app);

      const res = await request(app)
        .delete("/api/v1/links/999999")
        .set(authHeader(auth.accessToken));

      expect(res.status).toBe(404);
    });
  });

  describe("plan enforcement", () => {
    it("Free user cannot set custom expiry (403 FEATURE_NOT_AVAILABLE)", async () => {
      const auth = await registerAndLogin(app);

      const res = await request(app)
        .post("/api/v1/links")
        .set(authHeader(auth.accessToken))
        .send({
          originalUrl: "https://free-expiry.example.com",
          expiresAt: "2026-06-15T12:00:00+00:00",
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FEATURE_NOT_AVAILABLE");
    });

    it("Pro user can set custom expiry", async () => {
      const auth = await registerAndLogin(app);

      await prisma.subscription.updateMany({
        where: { userId: auth.user.id },
        data: { status: "ACTIVE" },
      });
      const sub = await prisma.subscription.findFirst({
        where: { userId: auth.user.id },
      });
      await prisma.subscription.update({
        where: { id: sub!.id },
        data: {
          plan: { connect: { type: "PRO" } },
        },
      });

      const res = await request(app)
        .post("/api/v1/links")
        .set(authHeader(auth.accessToken))
        .send({
          originalUrl: "https://pro-expiry.example.com",
          expiresAt: "2027-06-15T12:00:00+00:00",
        });

      expect(res.status).toBe(201);
      expect(new Date(res.body.link.expiresAt).toISOString().slice(0, 10)).toBe("2027-06-15");
    });

    it("returns 403 PLAN_LIMIT_REACHED when expiry exceeds maxExpiryDays", async () => {
      const auth = await registerAndLogin(app);

      const sub = await prisma.subscription.findFirst({
        where: { userId: auth.user.id },
      });
      await prisma.subscription.update({
        where: { id: sub!.id },
        data: { plan: { connect: { type: "PRO" } } },
      });

      const res = await request(app)
        .post("/api/v1/links")
        .set(authHeader(auth.accessToken))
        .send({
          originalUrl: "https://too-far.example.com",
          expiresAt: "2027-12-31T23:59:59+00:00",
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("PLAN_LIMIT_REACHED");
    });
  });
});
