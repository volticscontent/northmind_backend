import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();
const JSON_PATH = path.join(process.cwd(), "..", "data", "unified_products_en_gbp.json");

async function restorePhotos() {
  console.log("🏺 Starting EMERGENCY Photo Restoration...");
  
  if (!fs.existsSync(JSON_PATH)) {
    console.error("❌ JSON source not found!");
    process.exit(1);
  }

  const rawData = fs.readFileSync(JSON_PATH, "utf-8");
  const sourceProducts = JSON.parse(rawData);

  // Find all products with placeholder
  const badProducts = await prisma.produto.findMany({
    where: {
      OR: [
        { fotoPrincipal: { contains: "community/1" } },
        { fotoPrincipal: { contains: "placeholder" } }
      ]
    }
  });

  console.log(`🔍 Found ${badProducts.length} items needing restoration.`);

  for (const product of badProducts) {
    // Find matching product in JSON by name or handle
    const source = sourceProducts.find((p: any) => p.fullName === product.nome || p.handle === product.handle);

    if (source && source.images && source.images.length > 0) {
      const folderName = source.fullName.replace(/[^a-z0-9 ]/gi, "").trim();
      const newFotoPrincipal = "/assets/products/fragrances/" + folderName + "/" + source.images[0];
      const newFotos = source.images.slice(1).map((img: string) => "/assets/products/fragrances/" + folderName + "/" + img);

      await prisma.produto.update({
        where: { id: product.id },
        data: {
          fotoPrincipal: newFotoPrincipal,
          fotos: newFotos
        }
      });
      console.log(`✅ RESTORED: ${product.nome}`);
    } else {
      console.warn(`⚠️ Could not find source images for: ${product.nome}`);
    }
  }

  console.log("\n--- RESTORATION COMPLETE ---");
  await prisma.$disconnect();
}

restorePhotos().catch(err => {
  console.error("Fatal Restoration Error:", err);
  process.exit(1);
});
