import { z } from "zod";

const envSchema = z.object({
  VITE_API_URL: z.string().min(1),
});

// Fails with a clear error at startup if a variable is missing.
export const env = envSchema.parse(import.meta.env);
