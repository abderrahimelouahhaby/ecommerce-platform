import { z } from "zod";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const productSortValues = ["newest", "price_asc", "price_desc", "name_asc"] as const;

export type ProductSort = (typeof productSortValues)[number];

export const productListQuerySchema = z
  .object({
    search: z.string().trim().min(1).max(100).optional(),
    category: z.string().max(100).regex(slugPattern).optional(),
    minPrice: z.coerce.number().int().min(0).optional(),
    maxPrice: z.coerce.number().int().min(0).optional(),
    sort: z.enum(productSortValues).default("newest"),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(12),
  })
  .refine(
    (query) =>
      query.minPrice === undefined ||
      query.maxPrice === undefined ||
      query.minPrice <= query.maxPrice,
    { message: "minPrice must not be greater than maxPrice", path: ["minPrice"] },
  );

export type ProductListQuery = z.infer<typeof productListQuerySchema>;

export const productSlugParamsSchema = z.object({
  slug: z.string().max(150).regex(slugPattern),
});
