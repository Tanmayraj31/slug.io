import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../src/app.js";

describe("errors and security integration", () => {
  describe("error envelope", () => {
    it("unknown route returns 404 NOT_FOUND with consistent envelope", async () => {
      const res = await request(app).get("/no/such/route");

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        error: {
          code: "NOT_FOUND",
          message: "Route not found.",
        },
      });
    });

    it("malformed JSON body returns 400 INVALID_JSON", async () => {
      const res = await request(app)
        .post("/api/v1/auth/register")
        .set("Content-Type", "application/json")
        .send("{ invalid json }");

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("INVALID_JSON");
    });

    it("error envelope shape is consistent across status codes", async () => {
      const notFound = await request(app).get("/nonexistent");
      expect(notFound.body.error).toHaveProperty("code");
      expect(notFound.body.error).toHaveProperty("message");

      const auth = await request(app)
        .post("/api/v1/auth/login")
        .send({});
      expect(auth.body.error).toHaveProperty("code");
      expect(auth.body.error).toHaveProperty("message");
    });
  });

  describe("security headers", () => {
    it("helmet sets X-Content-Type-Options to nosniff", async () => {
      const res = await request(app).get("/health/live");

      expect(res.headers["x-content-type-options"]).toBe("nosniff");
    });

    it("helmet sets X-Frame-Options", async () => {
      const res = await request(app).get("/health/live");

      expect(res.headers["x-frame-options"]).toBeDefined();
    });

    it("helmet sets Strict-Transport-Security", async () => {
      const res = await request(app).get("/health/live");

      expect(res.headers["strict-transport-security"]).toBeDefined();
    });
  });
});
