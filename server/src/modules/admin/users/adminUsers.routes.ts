import { Router } from "express";
import { z } from "zod";
import { logAdminAction } from "../../../lib/audit.js";
import { getUserId } from "../../../lib/currentUser.js";
import { paginationShape } from "../../../lib/pagination.js";
import { idParamsSchema } from "../../../lib/params.js";
import { changeUserRole, listUsers } from "./adminUsers.service.js";

const listQuerySchema = z.object({
  ...paginationShape,
  search: z.string().trim().min(1).max(100).optional(),
});

const roleBodySchema = z.object({ role: z.enum(["USER", "ADMIN"]) });

export const adminUsersRouter = Router();

adminUsersRouter.get("/", async (req, res) => {
  const query = listQuerySchema.parse(req.query);
  const { items, pagination } = await listUsers(query);

  res.json({ data: items, pagination });
});

adminUsersRouter.patch("/:id/role", async (req, res) => {
  const adminId = getUserId(req);
  const { id } = idParamsSchema.parse(req.params);
  const { role } = roleBodySchema.parse(req.body);
  const user = await changeUserRole(adminId, id, role);

  logAdminAction(adminId, "user.role", { userId: id, role });
  res.json({ data: user });
});
