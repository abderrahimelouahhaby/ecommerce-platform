import { Router } from "express";
import { AppError } from "../../lib/appError.js";
import { requireAuth } from "../../middleware/requireAuth.js";

export const meRouter = Router();

// Returns the logged in user. Only safe fields are sent.
meRouter.get("/", requireAuth, (req, res) => {
  const user = req.user;

  if (!user) {
    throw new AppError(401, "Authentication required");
  }

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      role: user.role,
    },
  });
});
