import type { Prisma } from "../../../generated/prisma/client.js";
import { AppError } from "../../../lib/appError.js";
import { deleteProductImage, uploadProductImage } from "../../../lib/cloudinary.js";
import { detectImageType } from "../../../lib/imageType.js";
import { logger } from "../../../lib/logger.js";
import { pageInfo } from "../../../lib/pagination.js";
import { prisma } from "../../../lib/prisma.js";
import { makeUniqueSlug } from "../../../lib/slug.js";
import type {
  AdminProductListQuery,
  CreateProductInput,
  UpdateProductInput,
} from "./adminProducts.schema.js";

// What the admin receives. The Cloudinary id (imagePublicId) stays on the server.
export const adminProductSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  priceCents: true,
  stock: true,
  imageUrl: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  category: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.ProductSelect;

type UploadedFile = { buffer: Buffer };

async function removeImageQuietly(publicId: string | null | undefined): Promise<void> {
  if (!publicId) {
    return;
  }

  try {
    await deleteProductImage(publicId);
  } catch (error) {
    logger.warn({ err: error, publicId }, "Could not delete an image from Cloudinary");
  }
}

// Checks the real content of the file, then uploads it. No file means no image.
async function uploadImageIfAny(file: UploadedFile | undefined) {
  if (!file) {
    return null;
  }

  if (detectImageType(file.buffer) === null) {
    throw new AppError(400, "The image must be a JPEG, PNG or WebP file");
  }

  return uploadProductImage(file.buffer);
}

async function assertCategoryExists(categoryId: string): Promise<void> {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true },
  });

  if (!category) {
    throw new AppError(404, "Category not found");
  }
}

export async function listAdminProducts(query: AdminProductListQuery) {
  const { page, limit, search, status } = query;
  const where: Prisma.ProductWhereInput = {};

  if (status === "active") where.isActive = true;
  if (status === "inactive") where.isActive = false;

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
    ];
  }

  const [total, items] = await prisma.$transaction([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
      select: adminProductSelect,
    }),
  ]);

  return { items, pagination: pageInfo(page, limit, total) };
}

export async function createProduct(input: CreateProductInput, file?: UploadedFile) {
  await assertCategoryExists(input.categoryId);
  const image = await uploadImageIfAny(file);

  try {
    return await prisma.product.create({
      data: {
        name: input.name,
        slug: await makeUniqueSlug(input.name),
        description: input.description,
        priceCents: input.priceCents,
        stock: input.stock,
        categoryId: input.categoryId,
        isActive: input.isActive ?? true,
        imageUrl: image?.url ?? null,
        imagePublicId: image?.publicId ?? null,
      },
      select: adminProductSelect,
    });
  } catch (error) {
    // The product was not saved, so the uploaded image would stay unused. Remove it.
    await removeImageQuietly(image?.publicId);
    throw error;
  }
}

export async function updateProduct(id: string, input: UpdateProductInput, file?: UploadedFile) {
  const existing = await prisma.product.findUnique({
    where: { id },
    select: { id: true, imagePublicId: true },
  });

  if (!existing) {
    throw new AppError(404, "Product not found");
  }

  if (Object.keys(input).length === 0 && !file) {
    throw new AppError(400, "Nothing to update");
  }

  if (input.categoryId) {
    await assertCategoryExists(input.categoryId);
  }

  const image = await uploadImageIfAny(file);

  try {
    // The slug does not change when the name changes, so links to the product keep working.
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...input,
        ...(image ? { imageUrl: image.url, imagePublicId: image.publicId } : {}),
      },
      select: adminProductSelect,
    });

    // The new image is saved, the old one is not needed anymore.
    if (image) {
      await removeImageQuietly(existing.imagePublicId);
    }

    return product;
  } catch (error) {
    await removeImageQuietly(image?.publicId);
    throw error;
  }
}

// A product is never removed: orders keep pointing to it. It is hidden from the shop.
export async function deactivateProduct(id: string): Promise<void> {
  const updated = await prisma.product.updateMany({ where: { id }, data: { isActive: false } });

  if (updated.count === 0) {
    throw new AppError(404, "Product not found");
  }
}
