import cors from "cors";
import express from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { apiRouter } from "./routes/index.js";

export const app = express();

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

// stops someone from sending a giant body to slow the server down
app.use(express.json({ limit: "10kb" }));

app.use("/api", apiRouter);

// These two must stay last.
app.use(notFound);
app.use(errorHandler);
