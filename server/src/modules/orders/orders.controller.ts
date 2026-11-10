import type { RequestHandler } from "express";
import { getUserId } from "../../lib/currentUser.js";
import { createOrderSchema, orderParamsSchema } from "./orders.schema.js";
import { cancelOrder, createOrder, getOrder, listOrders } from "./orders.service.js";

export const createOrderHandler: RequestHandler = async (req, res) => {
  const userId = getUserId(req);
  const input = createOrderSchema.parse(req.body);

  const order = await createOrder(userId, input);

  res.status(201).json({ data: order });
};

export const listOrdersHandler: RequestHandler = async (req, res) => {
  const orders = await listOrders(getUserId(req));

  res.json({ data: orders });
};

export const getOrderHandler: RequestHandler = async (req, res) => {
  const userId = getUserId(req);
  const { id } = orderParamsSchema.parse(req.params);

  res.json({ data: await getOrder(userId, id) });
};

export const cancelOrderHandler: RequestHandler = async (req, res) => {
  const userId = getUserId(req);
  const { id } = orderParamsSchema.parse(req.params);

  res.json({ data: await cancelOrder(userId, id) });
};
