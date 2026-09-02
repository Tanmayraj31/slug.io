import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../src/app.js";
import { registerAndLogin, authHeader } from "../helpers/auth.js";
import { prisma } from "../../src/database/prisma.js";

async function createLinkAndClick(
  accessToken: string,
  url: string,
  clickCount: number
): Promise<{ linkId: number; shortCode: string }> {
  const created = await request(app)
    .post("/api/v1/links")
    .set(authHeader(accessToken))
    .send({ originalUrl: url });

  const linkId = created.body.link.id as number;
  const shortCode = created.body.link.shortCode as string;

  for (let i = 0; i < clickCount; i++) {
    await request(app).get(`/${shortCode}`);
  }

  return { linkId, shortCode };
}

describe("analytics integration", () => {
  describe("Free plan", () => {
    it("returns totalClicks with detailed: null", async () => {
      const auth = await registerAndLogin(app);
      const { linkId } = await createLinkAndClick(auth.accessToken, "https://analytics-free.example.com", 3);

      const res = await request(app)
        .get(`/api/v1/links/${linkId}/analytics`)
        .set(authHeader(auth.accessToken));

      expect(res.status).toBe(200);
      expect(res.body.totalClicks).toBe(3);
      expect(res.body.detailed).toBeNull();
    });

    it("returns 200 with totalClicks: 0 for link with no clicks", async () => {
      const auth = await registerAndLogin(app);

      const created = await request(app)
        .post("/api/v1/links")
        .set(authHeader(auth.accessToken))
        .send({ originalUrl: "https://no-clicks.example.com" });

      const res = await request(app)
        .get(`/api/v1/links/${created.body.link.id}/analytics`)
        .set(authHeader(auth.accessToken));

      expect(res.status).toBe(200);
      expect(res.body.totalClicks).toBe(0);
      expect(res.body.detailed).toBeNull();
    });
  });

  describe("Pro plan", () => {
    it("returns detailed analytics breakdown", async () => {
      const auth = await registerAndLogin(app);

      const sub = await prisma.subscription.findFirst({
        where: { userId: auth.user.id },
      });
      await prisma.subscription.update({
        where: { id: sub!.id },
        data: { plan: { connect: { type: "PRO" } } },
      });

      const { linkId } = await createLinkAndClick(
        auth.accessToken,
        "https://analytics-pro.example.com",
        2
      );

      const res = await request(app)
        .get(`/api/v1/links/${linkId}/analytics`)
        .set(authHeader(auth.accessToken));

      expect(res.status).toBe(200);
      expect(res.body.totalClicks).toBe(2);
      expect(res.body.detailed).not.toBeNull();
      expect(res.body.detailed).toMatchObject({
        clicksOverTime: expect.any(Array),
        referrers: expect.any(Array),
        browsers: expect.any(Array),
        operatingSystems: expect.any(Array),
        deviceTypes: expect.any(Array),
        countries: expect.any(Array),
      });
    });
  });

  describe("error cases", () => {
    it("returns 404 LINK_NOT_FOUND for nonexistent link", async () => {
      const auth = await registerAndLogin(app);

      const res = await request(app)
        .get("/api/v1/links/999999/analytics")
        .set(authHeader(auth.accessToken));

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("LINK_NOT_FOUND");
    });

    it("returns 404 LINK_NOT_FOUND for other user's link", async () => {
      const user1 = await registerAndLogin(app);
      const user2 = await registerAndLogin(app);

      const { linkId } = await createLinkAndClick(user1.accessToken, "https://owner-analytics.example.com", 1);

      const res = await request(app)
        .get(`/api/v1/links/${linkId}/analytics`)
        .set(authHeader(user2.accessToken));

      expect(res.status).toBe(404);
    });

    it("returns 401 UNAUTHORIZED without token", async () => {
      const res = await request(app).get("/api/v1/links/1/analytics");
      expect(res.status).toBe(401);
    });
  });
});
