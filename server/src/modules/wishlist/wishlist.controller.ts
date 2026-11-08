import type { RequestHandler } from "express";
import { getUserId } from "../../lib/currentUser.js";
import { wishlistParamsSchema } from "./wishlist.schema.js";
import { addToWishlist, listWishlist, removeFromWishlist } from "./wishlist.service.js";

export const listWishlistHandler: RequestHandler = async (req, res) => {
  const items = await listWishlist(getUserId(req));

  res.json({ data: items });
};

export const addToWishlistHandler: RequestHandler = async (req, res) => {
  const userId = getUserId(req);
  const { productId } = wishlistParamsSchema.parse(req.params);

  await addToWishlist(userId, productId);

  res.json({ data: { productId } });
};

export const removeFromWishlistHandler: RequestHandler = async (req, res) => {
  const userId = getUserId(req);
  const { productId } = wishlistParamsSchema.parse(req.params);

  await removeFromWishlist(userId, productId);

  res.status(204).send();
};
