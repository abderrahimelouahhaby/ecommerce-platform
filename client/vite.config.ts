import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vitest/config";

// The API address used by the dev proxy. The end to end tests change it.
const apiTarget = process.env.API_PROXY_TARGET ?? "http://localhost:4000";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    // Requests to /api are forwarded to the Express server.
    proxy: {
      "/api": apiTarget,
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
