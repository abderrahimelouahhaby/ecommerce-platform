import type { RequestHandler } from "express";
import { productListQuerySchema, productSlugParamsSchema } from "./products.schema.js";
import { getProductBySlug, listProducts } from "./products.service.js";

export const listProductsHandler: RequestHandler = async (req, res) => {
  const query = productListQuerySchema.parse(req.query);
  const { items, total } = await listProducts(query);

  res.json({
    data: items,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  });
};

export const getProductHandler: RequestHandler = async (req, res) => {
  const { slug } = productSlugParamsSchema.parse(req.params);
  const product = await getProductBySlug(slug);

  res.json({ data: product });
};
