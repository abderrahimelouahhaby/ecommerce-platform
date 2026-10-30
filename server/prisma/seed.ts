import { env } from "../src/config/env.js";
import { auth } from "../src/lib/auth.js";
import { prisma } from "../src/lib/prisma.js";
import { seedCategories } from "./seedData.js";

type Role = "USER" | "ADMIN";

// Creates the user through Better Auth if needed, then sets the role and verifies the email.
async function ensureUser(
  name: string,
  email: string,
  password: string,
  role: Role,
): Promise<void> {
  const existing = await prisma.user.findUnique({ where: { email } });

  if (!existing) {
    await auth.api.signUpEmail({ body: { name, email, password } });
  }

  await prisma.user.update({ where: { email }, data: { role, emailVerified: true } });
}

async function seedProducts(): Promise<number> {
  let productCount = 0;

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
        // Placeholder image. In part 14 admins upload real images to Cloudinary.
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

  return productCount;
}

async function main(): Promise<void> {
  if (env.NODE_ENV === "production") {
    throw new Error("Refusing to seed the database in production");
  }

  const productCount = await seedProducts();
  console.log(`Seeded ${seedCategories.length} categories and ${productCount} products`);

  if (env.ADMIN_EMAIL && env.ADMIN_PASSWORD) {
    await ensureUser("Admin", env.ADMIN_EMAIL, env.ADMIN_PASSWORD, "ADMIN");
    console.log(`Admin account ready: ${env.ADMIN_EMAIL}`);
  } else {
    console.warn("ADMIN_EMAIL and ADMIN_PASSWORD are not set, no admin account was created");
  }

  // A demo customer for development and for the Playwright tests later.
  await ensureUser("Demo Customer", "customer@example.com", "Customer-Pass-123", "USER");
  console.log("Demo customer ready: customer@example.com");
}

try {
  await main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
