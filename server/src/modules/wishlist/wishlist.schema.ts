import { z } from "zod";

// URL parameter of POST and DELETE /api/wishlist/:productId.
export const wishlistParamsSchema = z.object({
  productId: z.uuid(),
});
