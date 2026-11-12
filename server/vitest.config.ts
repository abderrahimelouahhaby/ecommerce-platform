import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
    env: {
      NODE_ENV: "test",
      PORT: "4000",
      CLIENT_URL: "http://localhost:5173",
      LOG_LEVEL: "silent",
      DATABASE_URL: "postgresql://ecommerce:ecommerce@localhost:5432/ecommerce_test",
      BETTER_AUTH_SECRET: "test-secret-that-is-at-least-32-characters-long",
      BETTER_AUTH_URL: "http://localhost:4000",
      STRIPE_SECRET_KEY: "sk_test_fake_key_used_only_in_tests",
      STRIPE_WEBHOOK_SECRET: "whsec_fake_secret_used_only_in_tests",
    },
  },
});
