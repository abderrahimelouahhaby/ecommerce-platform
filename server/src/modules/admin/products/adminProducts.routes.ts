import { Router } from "express";
import { getUserId } from "../../../lib/currentUser.js";
import { logAdminAction } from "../../../lib/audit.js";
import { idParamsSchema } from "../../../lib/params.js";
import { uploadImage } from "../../../middleware/upload.js";
import {
  adminProductListQuerySchema,
  createProductSchema,
  updateProductSchema,
} from "./adminProducts.schema.js";
import {
  createProduct,
  deactivateProduct,
  listAdminProducts,
  updateProduct,
} from "./adminProducts.service.js";

// This router is mounted behind requireAuth and requireAdmin (see admin.routes.ts),
// so visitors and customers never reach the upload code.
export const adminProductsRouter = Router();

adminProductsRouter.get("/", async (req, res) => {
  const query = adminProductListQuerySchema.parse(req.query);
  const { items, pagination } = await listAdminProducts(query);

  res.json({ data: items, pagination });
});

adminProductsRouter.post("/", uploadImage, async (req, res) => {
  const input = createProductSchema.parse(req.body);
  const product = await createProduct(input, req.file);

  logAdminAction(getUserId(req), "product.create", { productId: product.id });
  res.status(201).json({ data: product });
});

adminProductsRouter.patch("/:id", uploadImage, async (req, res) => {
  const { id } = idParamsSchema.parse(req.params);
  const input = updateProductSchema.parse(req.body ?? {});
  const product = await updateProduct(id, input, req.file);

  logAdminAction(getUserId(req), "product.update", { productId: id, fields: Object.keys(input) });
  res.json({ data: product });
});

adminProductsRouter.delete("/:id", async (req, res) => {
  const { id } = idParamsSchema.parse(req.params);

  await deactivateProduct(id);

  logAdminAction(getUserId(req), "product.deactivate", { productId: id });
  res.status(204).send();
});
