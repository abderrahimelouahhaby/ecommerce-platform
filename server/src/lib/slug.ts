import { prisma } from "./prisma.js";

// "Orbit 65W USB-C Charger" becomes "orbit-65w-usb-c-charger".
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// A product slug must be unique: if it exists, we add -2, -3, and so on.
export async function makeUniqueSlug(name: string): Promise<string> {
  const base = slugify(name) || "product";
  let slug = base;
  let counter = 1;

  while (await prisma.product.findUnique({ where: { slug }, select: { id: true } })) {
    counter += 1;
    slug = `${base}-${counter}`;
  }

  return slug;
}
