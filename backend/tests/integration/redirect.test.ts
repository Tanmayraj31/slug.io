import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../src/app.js";
import { registerAndLogin, authHeader } from "../helpers/auth.js";
import { prisma } from "../../src/database/prisma.js";

async function createActiveLink(accessToken: string, url: string): Promise<{ id: number; shortCode: string }> {
  const res = await request(app)
    .post("/api/v1/links")
    .set(authHeader(accessToken))
    .send({ originalUrl: url });

  return { id: res.body.link.id as number, shortCode: res.body.link.shortCode as string };
}

describe("redirect integration", () => {
  it("returns 302 with correct Location header", async () => {
    const auth = await registerAndLogin(app);
    const link = await createActiveLink(auth.accessToken, "https://redirect-target.example.com");

    const res = await request(app).get(`/${link.shortCode}`);

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("https://redirect-target.example.com/");
  });

  it("records a click event in the database", async () => {
    const auth = await registerAndLogin(app);
    const link = await createActiveLink(auth.accessToken, "https://click-record.example.com");

    await request(app).get(`/${link.shortCode}`);

    const click = await prisma.clickEvent.findFirst({
      where: { linkId: link.id },
    });
    expect(click).not.toBeNull();
    expect(click!.linkId).toBe(link.id);

    const updatedLink = await prisma.link.findUnique({ where: { id: link.id } });
    expect(updatedLink!.totalClicks).toBe(1);
  });

  it("returns 404 LINK_NOT_FOUND for nonexistent short code", async () => {
    const res = await request(app).get("/noshort");

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("LINK_NOT_FOUND");
  });

  it("returns 400 VALIDATION_ERROR for short code too short", async () => {
    const res = await request(app).get("/abc");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 410 LINK_GONE for disabled link", async () => {
    const auth = await registerAndLogin(app);
    const link = await createActiveLink(auth.accessToken, "https://disabled-link.example.com");

    await request(app)
      .patch(`/api/v1/links/${link.id}/status`)
      .set(authHeader(auth.accessToken))
      .send({ status: "DISABLED" });

    const res = await request(app).get(`/${link.shortCode}`);

    expect(res.status).toBe(410);
    expect(res.body.error.code).toBe("LINK_GONE");
  });

  it("returns 410 LINK_GONE for expired link", async () => {
    const auth = await registerAndLogin(app);

    await prisma.link.create({
      data: {
        userId: auth.user.id,
        originalUrl: "https://expired-link.example.com",
        shortCode: "exp01",
        status: "ACTIVE",
        expiresAt: new Date("2020-01-01T00:00:00Z"),
      },
    });

    const res = await request(app).get("/exp01");

    expect(res.status).toBe(410);
    expect(res.body.error.code).toBe("LINK_GONE");
  });

  it("records user-agent details in click event", async () => {
    const auth = await registerAndLogin(app);
    const link = await createActiveLink(auth.accessToken, "https://ua-record.example.com");

    await request(app)
      .get(`/${link.shortCode}`)
      .set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0");

    const click = await prisma.clickEvent.findFirst({
      where: { linkId: link.id },
    });
    expect(click).not.toBeNull();
    expect(click!.browser).toBe("Chrome");
    expect(click!.operatingSystem).toBe("Windows");
  });

  it("increments totalClicks on each redirect", async () => {
    const auth = await registerAndLogin(app);
    const link = await createActiveLink(auth.accessToken, "https://multi-click.example.com");

    await request(app).get(`/${link.shortCode}`);
    await request(app).get(`/${link.shortCode}`);
    await request(app).get(`/${link.shortCode}`);

    const updated = await prisma.link.findUnique({ where: { id: link.id } });
    expect(updated!.totalClicks).toBe(3);
  });
});
