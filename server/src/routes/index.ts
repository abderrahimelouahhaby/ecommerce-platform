import { Router } from "express";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { adminRouter } from "../modules/admin/admin.routes.js";
import { healthRouter } from "../modules/health/health.routes.js";
import { meRouter } from "../modules/me/me.routes.js";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/me", meRouter);

// Secure by default: every route added to adminRouter needs a logged in admin.
apiRouter.use("/admin", requireAuth, requireAdmin, adminRouter);
