import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../../app.js";
import { env } from "../../config/env.js";

describe("GET /api/health", () => {
  it("returns status ok", async () => {
    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("sends security headers and hides the framework name", async () => {
    const res = await request(app).get("/api/health");

    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });
});

describe("CORS", () => {
  it("allows the client origin with credentials", async () => {
    const res = await request(app).get("/api/health").set("Origin", env.CLIENT_URL);

    expect(res.headers["access-control-allow-origin"]).toBe(env.CLIENT_URL);
    expect(res.headers["access-control-allow-credentials"]).toBe("true");
  });

  it("never allows another origin", async () => {
    const res = await request(app).get("/api/health").set("Origin", "http://evil.example");

    expect(res.headers["access-control-allow-origin"]).not.toBe("http://evil.example");
  });
});

describe("error handling", () => {
  it("returns 404 in JSON for an unknown route", async () => {
    const res = await request(app).get("/api/does-not-exist");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: { message: "Route not found" } });
  });

  it("returns 400 for a broken JSON body", async () => {
    const res = await request(app)
      .post("/api/health")
      .set("Content-Type", "application/json")
      .send("{ this is not json");

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: { message: "Bad request" } });
  });
});
