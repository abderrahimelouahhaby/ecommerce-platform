import type { Request } from "express";
import { AppError } from "./appError.js";

// The id of the logged in user. Always use this id for ownership checks,
// never an id sent by the client (in the URL, the body or the query).
export function getUserId(req: Request): string {
  if (!req.user) {
    throw new AppError(401, "Authentication required");
  }

  return req.user.id;
}
