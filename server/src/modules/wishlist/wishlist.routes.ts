import { Router } from "express";
import {
  addToWishlistHandler,
  listWishlistHandler,
  removeFromWishlistHandler,
} from "./wishlist.controller.js";

export const wishlistRouter = Router();

wishlistRouter.get("/", listWishlistHandler);
wishlistRouter.post("/:productId", addToWishlistHandler);
wishlistRouter.delete("/:productId", removeFromWishlistHandler);
