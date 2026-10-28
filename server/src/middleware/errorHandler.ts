import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError, z } from "zod";
import { AppError } from "../lib/appError.js";
import { logger } from "../lib/logger.js";

// Runs when no route matched the request.
export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ error: { message: "Route not found" } });
};

// Runs when any route or middleware throws an error.
// Express knows it is an error handler because it has exactly 4 parameters.
export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: { message: err.message } });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: { message: "Validation failed", details: z.flattenError(err).fieldErrors },
    });
    return;
  }

  // Errors created by Express itself, for example invalid JSON or a body that is too large.
  if (typeof err?.status === "number" && err.status >= 400 && err.status < 500) {
    res.status(err.status).json({ error: { message: "Bad request" } });
    return;
  }

  // Anything else is a bug on our side. Log the details, but never send them to the client.
  logger.error({ err }, "Unhandled error");
  res.status(500).json({ error: { message: "Internal server error" } });
};
