import request from "supertest";
import { afterAll, describe, expect, it } from "vitest";
import { app } from "../../app.js";
import { prisma } from "../../lib/prisma.js";

afterAll(async () => {
  await prisma.$disconnect();
});

describe("GET /api/health/db", () => {
  it("reports the database as up", async () => {
    const res = await request(app).get("/api/health/db");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok", database: "up" });
  });
});
