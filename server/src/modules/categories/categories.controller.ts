import type { RequestHandler } from "express";
import { listCategories } from "./categories.service.js";

export const listCategoriesHandler: RequestHandler = async (_req, res) => {
  const categories = await listCategories();

  res.json({ data: categories });
};
