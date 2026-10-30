import request from "supertest";
import { afterAll, describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { env } from "../src/config/env.js";
import { prisma } from "../src/lib/prisma.js";
import { PASSWORD, cleanupUsers, makeAdmin, registerUser } from "./helpers/users.js";

afterAll(async () => {
  await cleanupUsers();
  await prisma.$disconnect();
});

describe("registration", () => {
  it("creates a customer and stores a hashed password", async () => {
    const { email, res } = await registerUser("signup");

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(email);

    const user = await prisma.user.findUnique({ where: { email } });
    expect(user?.role).toBe("USER");

    const account = await prisma.account.findFirst({ where: { user: { email } } });
    expect(account?.password).toBeTruthy();
    expect(account?.password).not.toBe(PASSWORD);
  });

  it("rejects a password shorter than 8 characters", async () => {
    const res = await request(app)
      .post("/api/auth/sign-up/email")
      .set("Origin", env.CLIENT_URL)
      .send({ name: "Short", email: "short-password@example.test", password: "short" });

    expect(res.status).toBe(400);
  });

  it("rejects an email that is already used", async () => {
    const { email } = await registerUser("duplicate");

    const res = await request(app)
      .post("/api/auth/sign-up/email")
      .set("Origin", env.CLIENT_URL)
      .send({ name: "Copy", email, password: PASSWORD });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  it("does not let a visitor choose their own role", async () => {
    const { email } = await registerUser("escalation", { role: "ADMIN" });

    const user = await prisma.user.findUnique({ where: { email } });
    expect(user?.role).not.toBe("ADMIN");
  });
});

describe("login", () => {
  it("logs in with the right password and sets a protected cookie", async () => {
    const { email } = await registerUser("login");

    const res = await request(app)
      .post("/api/auth/sign-in/email")
      .set("Origin", env.CLIENT_URL)
      .send({ email, password: PASSWORD });

    const cookies = String(res.headers["set-cookie"]);

    expect(res.status).toBe(200);
    expect(cookies).toContain("better-auth.session_token");
    expect(cookies).toMatch(/HttpOnly/i);
    expect(cookies).toMatch(/SameSite=Lax/i);
  });

  it("rejects a wrong password", async () => {
    const { email } = await registerUser("wrong-password");

    const res = await request(app)
      .post("/api/auth/sign-in/email")
      .set("Origin", env.CLIENT_URL)
      .send({ email, password: "this-is-not-the-password" });

    expect(res.status).toBe(401);
  });
});

describe("session", () => {
  it("returns 401 on /api/me without a session", async () => {
    const res = await request(app).get("/api/me");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: { message: "Authentication required" } });
  });

  it("returns the user on /api/me, without any secret field", async () => {
    const { agent, email } = await registerUser("me");

    const res = await agent.get("/api/me");

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(email);
    expect(res.body.user.role).toBe("USER");
    expect(res.body.user).not.toHaveProperty("password");
  });

  it("ends the session on sign out", async () => {
    const { agent } = await registerUser("signout");

    const signOut = await agent.post("/api/auth/sign-out").set("Origin", env.CLIENT_URL).send({});
    const afterSignOut = await agent.get("/api/me");

    expect(signOut.status).toBe(200);
    expect(afterSignOut.status).toBe(401);
  });
});

describe("admin access", () => {
  it("returns 401 for a visitor who is not logged in", async () => {
    const res = await request(app).get("/api/admin/ping");

    expect(res.status).toBe(401);
  });

  it("returns 403 for a customer", async () => {
    const { agent } = await registerUser("customer");

    const res = await agent.get("/api/admin/ping");

    expect(res.status).toBe(403);
  });

  it("returns 200 for an admin", async () => {
    const { agent, email } = await registerUser("admin");
    await makeAdmin(email);

    const res = await agent.get("/api/admin/ping");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});
