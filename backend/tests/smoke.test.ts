import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../src/app.js";
import { prisma } from "../src/database/prisma.js";

describe("smoke", () => {
  it("serves GET /health/live", async () => {
    const response = await request(app).get("/health/live");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  it("registers a user against the test database", async () => {
    const response = await request(app).post("/api/v1/auth/register").send({
      email: "smoke@example.com",
      password: "password123",
    });

    expect(response.status).toBe(201);
    expect(response.body.user).toHaveProperty("id");
  });

  it("proves DB isolation: same email is available again after cleanup", async () => {
    const existing = await prisma.user.findUnique({
      where: { email: "smoke@example.com" },
    });
    expect(existing).toBeNull();

    const response = await request(app).post("/api/v1/auth/register").send({
      email: "smoke@example.com",
      password: "password123",
    });

    expect(response.status).toBe(201);
  });
});