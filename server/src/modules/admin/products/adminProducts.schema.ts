import { z } from "zod";
import { paginationShape } from "../../../lib/pagination.js";

// A form (multipart) sends everything as text: "true", "1999". A JSON body sends real values.
const booleanField = z.union([z.boolean(), z.stringbool()]);

export const createProductSchema = z.object({
  name: z.string().trim().min(2).max(200),
  description: z.string().trim().min(10).max(5000),
  priceCents: z.coerce.number().int().min(0).max(100_000_000),
  stock: z.coerce.number().int().min(0).max(100_000),
  categoryId: z.uuid(),
  isActive: booleanField.optional(),
});

// An update can change any of these fields, or only some of them.
export const updateProductSchema = createProductSchema.partial();

export const adminProductListQuerySchema = z.object({
  ...paginationShape,
  search: z.string().trim().min(1).max(100).optional(),
  status: z.enum(["all", "active", "inactive"]).default("all"),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type AdminProductListQuery = z.infer<typeof adminProductListQuerySchema>;
