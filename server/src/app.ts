import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { env } from "./config/env.js";
import { auth } from "./lib/auth.js";
import { logger } from "./lib/logger.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { createRateLimiter } from "./middleware/rateLimit.js";
import { apiRouter } from "./routes/index.js";

export const app = express();

// Behind a hosting proxy (like Render) the real client IP is in a header.
// Without this, every visitor would look like the same IP to the rate limiter.
app.set("trust proxy", env.NODE_ENV === "production" ? 1 : false);

// Log every request, except the health check (it would fill the logs).
app.use(
  pinoHttp({
    logger,
    autoLogging: { ignore: (req) => req.url === "/api/health" },
  }),
);

// Security headers.
app.use(helmet());

// Only our frontend may call the API from a browser. "credentials" allows cookies (sessions).
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));

// Authentication routes (/api/auth/*).
// They must come BEFORE express.json(), because Better Auth reads the request body itself.
const fifteenMinutes = 15 * 60 * 1000;
const skipInTests = (): boolean => env.NODE_ENV === "test";

app.use(
  "/api/auth",
  createRateLimiter({ windowMs: fifteenMinutes, limit: 300, skip: skipInTests }),
);
app.use(
  ["/api/auth/sign-in", "/api/auth/sign-up"],
  createRateLimiter({ windowMs: fifteenMinutes, limit: 10, skip: skipInTests }),
);
app.all("/api/auth/*splat", toNodeHandler(auth));

// Note for later: the Stripe webhook must also be mounted before this line.
app.use(express.json({ limit: "10kb" }));

app.use("/api", apiRouter);

// These two must stay last.
app.use(notFound);
app.use(errorHandler);
