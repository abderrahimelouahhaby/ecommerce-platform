import { randomUUID } from "node:crypto";
import request from "supertest";
import { app } from "../../src/app.js";
import { env } from "../../src/config/env.js";
import { prisma } from "../../src/lib/prisma.js";

export const PASSWORD = "Test-password-123";

const createdEmails: string[] = [];

export function uniqueEmail(label: string): string {
  return `${label}-${randomUUID().slice(0, 8)}@example.test`;
}

// Registers a new user. The returned agent keeps the session cookie, like a browser.
export async function registerUser(label = "user", extraFields: Record<string, unknown> = {}) {
  const email = uniqueEmail(label);
  createdEmails.push(email);

  const agent = request.agent(app);
  const res = await agent
    .post("/api/auth/sign-up/email")
    .set("Origin", env.CLIENT_URL)
    .send({ name: "Test User", email, password: PASSWORD, ...extraFields });

  return { agent, email, res };
}

export async function makeAdmin(email: string): Promise<void> {
  await prisma.user.update({ where: { email }, data: { role: "ADMIN" } });
}

// Deletes the users created by the tests, and their orders first (an order keeps its user).
// Sessions, accounts, wishlist rows and order items are deleted with their parent.
export async function cleanupUsers(): Promise<void> {
  await prisma.order.deleteMany({ where: { user: { email: { in: createdEmails } } } });
  await prisma.user.deleteMany({ where: { email: { in: createdEmails } } });
  createdEmails.length = 0;
}
