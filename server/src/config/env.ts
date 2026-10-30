import dotenv from "dotenv";
import { z } from "zod";

// Read the .env file (if it exists) into process.env.
// Values that already exist are not replaced, so real server settings win.
dotenv.config({ quiet: true });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  CLIENT_URL: z.url(),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  ADMIN_EMAIL: z.email().optional(),
  ADMIN_PASSWORD: z.string().min(12).optional(),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  // The logger is not available yet (it needs these values), so we use console here.
  console.error("Invalid environment variables:", z.flattenError(result.error).fieldErrors);
  process.exit(1);
}

export const env = result.data;
