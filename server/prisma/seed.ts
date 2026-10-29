import { env } from "../src/config/env.js";
import { prisma } from "../src/lib/prisma.js";
import { seedCategories } from "./seedData.js";

async function main(): Promise<void> {
  if (env.NODE_ENV === "production") {
    throw new Error("Refusing to seed the database in production");
  }

  let productCount = 0;
  // never get duplicates
  for (const category of seedCategories) {
    const savedCategory = await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name },
      create: { name: category.name, slug: category.slug },
    });

    for (const product of category.products) {
      const data = {
        name: product.name,
        description: product.description,
        priceCents: product.priceCents,
        stock: product.stock,
        // Placeholder image. Later admins upload real images to Cloudinary.
        imageUrl: `https://placehold.co/600x600/png?text=${encodeURIComponent(product.name)}`,
        categoryId: savedCategory.id,
      };

      await prisma.product.upsert({
        where: { slug: product.slug },
        update: data,
        create: { ...data, slug: product.slug },
      });

      productCount += 1;
    }
  }

  console.log(`Seeded ${seedCategories.length} categories and ${productCount} products`);
}

try {
  await main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
