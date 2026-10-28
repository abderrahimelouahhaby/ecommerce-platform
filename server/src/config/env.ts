import dotenv from "dotenv";
import { z } from "zod";

// hiding a startup message the library prints.
dotenv.config({ quiet: true });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  CLIENT_URL: z.url(),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  DATABASE_URL: z.string().min(1),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  // The logger is not available yet (it needs these values), so we use console here.
  console.error("Invalid environment variables:", z.flattenError(result.error).fieldErrors);
  process.exit(1);
}

export const env = result.data;
