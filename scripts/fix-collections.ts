import prisma from '../src/lib/prisma';

async function main() {
  console.log("🛠️ Fixing collections and restoring 'Silent Warmth'...");

  // 1. Map Jackets
  const jacketHandles = [
    "retro-nuptse-jacket",
    "the-gorham-down-jacket-1",
    "the-gorham-down-jacket",
    "wyoming-600-fill-down-jacket",
    "fleece-lined-down-jacket",
    "packable-water-repellent-jacket"
  ];

  // 2. Map Silent Warmth (Sweaters, Knits, etc)
  const silentWarmthHandles = [
    "polo-bear-linen-cotton-jumper",
    "usa-flag-cotton-sweater",
    "cable-knit-cotton-sweater",
    "cotton-mesh-knit-polo-shirt",
    "textured-knit-cotton-sweater"
  ];

  for (const handle of jacketHandles) {
    try {
      await prisma.produto.updateMany({
        where: { 
          OR: [
            { handle: { contains: handle, mode: 'insensitive' } },
            { nome: { contains: 'Jacket', mode: 'insensitive' } }
          ]
        },
        data: { collection: "Jackets" }
      });
      console.log(`✅ Set 'Jackets' for handle containing: ${handle}`);
    } catch (e) {
      console.error(`Error updating ${handle}:`, e);
    }
  }

  for (const handle of silentWarmthHandles) {
    try {
      await prisma.produto.updateMany({
        where: { 
          OR: [
            { handle: { contains: handle, mode: 'insensitive' } },
            { nome: { contains: 'Sweater', mode: 'insensitive' } },
            { nome: { contains: 'Jumper', mode: 'insensitive' } },
            { nome: { contains: 'Knit', mode: 'insensitive' } }
          ]
        },
        data: { collection: "Silent Warmth" }
      });
      console.log(`✅ Set 'Silent Warmth' for handle containing: ${handle}`);
    } catch (e) {
      console.error(`Error updating ${handle}:`, e);
    }
  }

  console.log("✨ Collections restored successfully!");
  await prisma.$disconnect();
}

main();
