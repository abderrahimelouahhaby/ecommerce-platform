import { Router } from "express";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { adminRouter } from "../modules/admin/admin.routes.js";
import { categoriesRouter } from "../modules/categories/categories.routes.js";
import { healthRouter } from "../modules/health/health.routes.js";
import { meRouter } from "../modules/me/me.routes.js";
import { ordersRouter } from "../modules/orders/orders.routes.js";
import { paymentsRouter } from "../modules/payments/payments.routes.js";
import { productsRouter } from "../modules/products/products.routes.js";
import { wishlistRouter } from "../modules/wishlist/wishlist.routes.js";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/me", meRouter);
apiRouter.use("/products", productsRouter);
apiRouter.use("/categories", categoriesRouter);

// Secure by default: every route in these routers needs a logged in user.
// (The Stripe webhook is mounted in app.ts, before the JSON parser. It uses a signature, not a login.)
apiRouter.use("/wishlist", requireAuth, wishlistRouter);
apiRouter.use("/orders", requireAuth, ordersRouter);
apiRouter.use("/payments", requireAuth, paymentsRouter);

// Secure by default: every route added to adminRouter needs a logged in admin.
apiRouter.use("/admin", requireAuth, requireAdmin, adminRouter);
