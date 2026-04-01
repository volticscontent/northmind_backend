import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function updateClothingSizes() {
  console.log("🏺 Standardizing Clothing Sizes & Global Variants (S-XXL)...");

  // Fetch all products that are NOT fragrances 
  const products = await prisma.produto.findMany({
    where: {
      NOT: {
        OR: [
          { collection: { contains: "fragrance", mode: "insensitive" } },
          { collection: { contains: "offer", mode: "insensitive" } }
        ]
      }
    }
  });

  console.log(`🔍 Found ${products.length} clothing items to update.`);

  const standardSizes = ["S", "M", "L", "XL", "XXL"];

  for (const product of products) {
    // Basic variants with same price as the product
    const variants = standardSizes.map(size => ({
      name: size,
      sku: `${product.handle}-${size}`.toUpperCase(),
      price: product.preco,
      originalPrice: product.precoOriginal || product.preco,
      stock: 100
    }));

    await prisma.produto.update({
      where: { id: product.id },
      data: {
        opcoesTamanho: standardSizes,
        variantes: variants as any
      }
    });
    console.log(`✅ UPDATED: ${product.nome} (S-XXL + Variants)`);
  }

  console.log("\n--- UPDATE COMPLETE ---");
  await prisma.$disconnect();
}

updateClothingSizes().catch(err => {
  console.error("Fatal Update Error:", err);
  process.exit(1);
});
