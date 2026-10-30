import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createRateLimiter } from "./rateLimit.js";

// A tiny app with its own limiter, so the test does not depend on the real app.
function buildApp(limit: number) {
  const app = express();
  app.use(createRateLimiter({ windowMs: 60_000, limit }));
  app.get("/", (_req, res) => {
    res.json({ ok: true });
  });
  return app;
}

describe("rate limiter", () => {
  it("allows requests under the limit", async () => {
    const app = buildApp(3);

    for (let i = 0; i < 3; i += 1) {
      const res = await request(app).get("/");
      expect(res.status).toBe(200);
    }
  });

  it("answers 429 in JSON after the limit", async () => {
    const app = buildApp(2);

    await request(app).get("/");
    await request(app).get("/");
    const res = await request(app).get("/");

    expect(res.status).toBe(429);
    expect(res.body).toEqual({ error: { message: "Too many requests, please try again later" } });
  });
});
