import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const updates = [
    { handle: "fragrances", image: "/collections/fragrances.png" },
    { handle: "jackets", image: "/collections/jackets.png" },
    { handle: "t-shirts", image: "/collections/t-shirts.png" },
    { handle: "special-promo", image: "/collections/special-promo.png" },
    { handle: "kits", image: "/collections/kits.png" },
    { handle: "silent-warmth", image: "/collections/silent-warmth.png" }
  ];

  console.log('🖼️ Synchronizing high-fidelity banners...');

  for (const update of updates) {
    const result = await prisma.collection.update({
      where: { handle: update.handle },
      data: { image: update.image }
    });
    console.log(`✅ Updated image for: ${result.name}`);
  }

  console.log('✨ Brand sync complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
