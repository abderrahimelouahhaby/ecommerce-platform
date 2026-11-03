import { defineConfig, devices } from "@playwright/test";

// The tests use their own ports and the test database,
// so they never touch the development servers or data.
const apiPort = 4100;
const clientPort = 5174;

export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${clientPort}`,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "npm run dev --prefix ../server",
      url: `http://localhost:${apiPort}/api/health`,
      reuseExistingServer: !process.env.CI,
      env: {
        NODE_ENV: "test",
        PORT: String(apiPort),
        CLIENT_URL: `http://localhost:${clientPort}`,
        BETTER_AUTH_URL: `http://localhost:${apiPort}`,
        DATABASE_URL: "postgresql://ecommerce:ecommerce@localhost:5432/ecommerce_test",
        LOG_LEVEL: "warn",
      },
    },
    {
      command: `npm run dev -- --port ${clientPort} --strictPort`,
      url: `http://localhost:${clientPort}`,
      reuseExistingServer: !process.env.CI,
      env: { API_PROXY_TARGET: `http://localhost:${apiPort}` },
    },
  ],
});
