import type { Prisma } from "../../../generated/prisma/client.js";
import { AppError } from "../../../lib/appError.js";
import { pageInfo } from "../../../lib/pagination.js";
import { prisma } from "../../../lib/prisma.js";

// Never the password or the sessions: they are in other tables.
const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  emailVerified: true,
  createdAt: true,
  _count: { select: { orders: true } },
} satisfies Prisma.UserSelect;

function toAdminUser({ _count, ...user }: Prisma.UserGetPayload<{ select: typeof userSelect }>) {
  return { ...user, orderCount: _count.orders };
}

type UserListQuery = { page: number; limit: number; search?: string | undefined };

export async function listUsers({ page, limit, search }: UserListQuery) {
  const where: Prisma.UserWhereInput = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  const [total, users] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
      select: userSelect,
    }),
  ]);

  return { items: users.map(toAdminUser), pagination: pageInfo(page, limit, total) };
}

export async function changeUserRole(actorId: string, userId: string, role: "USER" | "ADMIN") {
  // An admin cannot change their own role: the shop can never lose its last admin by accident.
  if (actorId === userId) {
    throw new AppError(400, "You cannot change your own role");
  }

  const updated = await prisma.user.updateMany({ where: { id: userId }, data: { role } });

  if (updated.count === 0) {
    throw new AppError(404, "User not found");
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: userSelect });

  return toAdminUser(user);
}
