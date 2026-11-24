import { Router } from "express";
import { z } from "zod";
import { logAdminAction } from "../../../lib/audit.js";
import { getUserId } from "../../../lib/currentUser.js";
import { paginationShape } from "../../../lib/pagination.js";
import { idParamsSchema } from "../../../lib/params.js";
import { listInventory, setStock } from "./adminInventory.service.js";

const listQuerySchema = z.object({
  ...paginationShape,
  status: z.enum(["all", "low", "out"]).default("all"),
});

// A whole number from 0. The database also refuses a negative stock.
const stockBodySchema = z.object({ stock: z.number().int().min(0).max(100_000) });

export const adminInventoryRouter = Router();

adminInventoryRouter.get("/", async (req, res) => {
  const query = listQuerySchema.parse(req.query);
  const { items, pagination } = await listInventory(query);

  res.json({ data: items, pagination });
});

adminInventoryRouter.patch("/:id", async (req, res) => {
  const { id } = idParamsSchema.parse(req.params);
  const { stock } = stockBodySchema.parse(req.body);
  const product = await setStock(id, stock);

  logAdminAction(getUserId(req), "inventory.stock", { productId: id, stock });
  res.json({ data: product });
});
