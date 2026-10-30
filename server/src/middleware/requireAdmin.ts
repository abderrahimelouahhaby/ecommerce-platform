import type { RequestHandler } from "express";
import { AppError } from "../lib/appError.js";

// Must run after requireAuth. Lets the request pass only for admins.
export const requireAdmin: RequestHandler = (req, _res, next) => {
  if (!req.user) {
    throw new AppError(401, "Authentication required");
  }

  if (req.user.role !== "ADMIN") {
    throw new AppError(403, "Admin access required");
  }

  next();
};
