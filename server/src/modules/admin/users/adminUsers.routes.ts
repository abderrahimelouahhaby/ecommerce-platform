import { Router } from "express";
import { z } from "zod";
import { logAdminAction } from "../../../lib/audit.js";
import { getUserId } from "../../../lib/currentUser.js";
import { paginationShape } from "../../../lib/pagination.js";
import { changeUserRole, listUsers } from "./adminUsers.service.js";

const listQuerySchema = z.object({
  ...paginationShape,
  search: z.string().trim().min(1).max(100).optional(),
});

// User ids are created by Better Auth, they are NOT UUIDs (unlike products and orders).
// Letters, digits, dash and underscore only, with a maximum length.
const userParamsSchema = z.object({ id: z.string().regex(/^[A-Za-z0-9_-]{1,64}$/) });

const roleBodySchema = z.object({ role: z.enum(["USER", "ADMIN"]) });

export const adminUsersRouter = Router();

adminUsersRouter.get("/", async (req, res) => {
  const query = listQuerySchema.parse(req.query);
  const { items, pagination } = await listUsers(query);

  res.json({ data: items, pagination });
});

adminUsersRouter.patch("/:id/role", async (req, res) => {
  const adminId = getUserId(req);
  const { id } = userParamsSchema.parse(req.params);
  const { role } = roleBodySchema.parse(req.body);
  const user = await changeUserRole(adminId, id, role);

  logAdminAction(adminId, "user.role", { userId: id, role });
  res.json({ data: user });
});
