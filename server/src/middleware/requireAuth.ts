import { fromNodeHeaders } from "better-auth/node";
import type { RequestHandler } from "express";
import { AppError } from "../lib/appError.js";
import { auth } from "../lib/auth.js";

// Lets the request pass only if it has a valid session. Puts the user on req.user.
export const requireAuth: RequestHandler = async (req, _res, next) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });

  if (!session) {
    throw new AppError(401, "Authentication required");
  }

  req.user = session.user;
  next();
};
