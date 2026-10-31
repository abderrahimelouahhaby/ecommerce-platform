import { Router } from "express";
import { getProductHandler, listProductsHandler } from "./products.controller.js";

export const productsRouter = Router();

productsRouter.get("/", listProductsHandler);
productsRouter.get("/:slug", getProductHandler);
