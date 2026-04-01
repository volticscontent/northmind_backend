import { PrismaClient } from "@prisma/client";
import sizeOf from "image-size";
import path from "path";
import fs from "fs";

const prisma = new PrismaClient();
const PUBLIC_DIR = path.join(process.cwd(), "..", "public");

async function checkImageRatios() {
  console.log("🚀 Starting North Mind Image Ratio Checkup (Elite 6:7)...");

  // Targeted collections
  const products = await prisma.produto.findMany({
    where: {
      OR: [
        { collection: { contains: "fragrance", mode: "insensitive" } },
        { collection: { contains: "offer", mode: "insensitive" } }
      ]
    }
  });

  console.log(`🔍 Found ${products.length} products to scan.`);

  let totalRemoved = 0;
  let productsUpdatedCount = 0;

  for (const product of products) {
    const allImages = [product.fotoPrincipal, ...(product.fotos || [])].filter(Boolean) as string[];
    const validImages: string[] = [];
    let isModified = false;

    for (const imagePath of allImages) {
      const absolutePath = path.join(PUBLIC_DIR, imagePath.startsWith("/") ? imagePath.slice(1) : imagePath);

      if (!fs.existsSync(absolutePath)) {
        console.warn(`⚠️ File not found: ${imagePath} for product ${product.nome}`);
        isModified = true;
        totalRemoved++;
        continue;
      }

      try {
        const buffer = fs.readFileSync(absolutePath);
        const dimensions = sizeOf(buffer);
        if (dimensions.width && dimensions.height) {
          const ratio = dimensions.width / dimensions.height;
          // Target 6:7 = 0.857... 
          // If ratio > 0.9 it's too horizontal (square or landscape)
          if (ratio > 0.9) {
            console.log(`❌ REMOVING wide image (${dimensions.width}x${dimensions.height}) [Ratio: ${ratio.toFixed(2)}]: ${imagePath} from ${product.nome}`);
            totalRemoved++;
            isModified = true;
          } else {
            validImages.push(imagePath);
          }
        }
      } catch (err) {
        console.error(`🔴 Error processing ${imagePath}:`, (err as Error).message);
        isModified = true;
        totalRemoved++;
      }
    }

    if (isModified) {
      // ELITE SECURITY: If all images are invalid, keep the first one anyway but log it
      if (validImages.length === 0) {
        console.warn(`⚠️ ALL images for ${product.nome} are invalid ratio. Keeping the original principal to avoid empty product.`);
        validImages.push(allImages[0]);
      }

      const newFotoPrincipal = validImages[0];
      const newFotos = validImages.slice(1);

      await prisma.produto.update({
        where: { id: product.id },
        data: {
          fotoPrincipal: newFotoPrincipal,
          fotos: newFotos
        }
      });
      productsUpdatedCount++;
      console.log(`✅ UPDATED product ${product.nome}. New gallery size: ${validImages.length}`);
    }
  }

  console.log("\n--- CHECKUP COMPLETE ---");
  console.log(`📸 Images removed: ${totalRemoved}`);
  console.log(`🏛️ Products sync'd: ${productsUpdatedCount}/${products.length}`);
  
  await prisma.$disconnect();
}

checkImageRatios().catch(err => {
  console.error("Fatal Checkup Error:", err);
  process.exit(1);
});
