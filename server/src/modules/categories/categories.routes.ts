import { Router } from "express";
import { listCategoriesHandler } from "./categories.controller.js";

export const categoriesRouter = Router();

categoriesRouter.get("/", listCategoriesHandler);
