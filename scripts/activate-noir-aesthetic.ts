import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const updates = [
    { handle: "fragrances", name: "Fragrances", image: "/collections/fragrances.png", desc: "Signature scents and modern chic perfumery. Noir Collection." },
    { handle: "jackets", name: "Jackets", image: "/collections/jackets.png", desc: "Heritage leather and urban tailoring. Noir Collection." },
    { handle: "t-shirts", name: "T-Shirts", image: "/collections/t-shirts.png", desc: "Minimalist luxury essentials in premium cotton. Noir Collection." },
    { handle: "special-promo", name: "Special Promo", image: "/collections/special-promo.png", desc: "Exclusive access to seasonal drops and limited pieces." },
    { handle: "kits", name: "Kits", image: "/collections/kits.png", desc: "Curated gift sets for the complete luxury experience." },
    { handle: "silent-warmth", name: "Silent Warmth", image: "/collections/silent-warmth.png", desc: "Premium heavyweight knitwear and winter essences. Noir Collection." }
  ];

  console.log('🎞️ Activating NOIR SOPHISTICATION aesthetic...');

  for (const item of updates) {
    const result = await prisma.collection.upsert({
      where: { handle: item.handle },
      update: {
        image: item.image,
        description: item.desc,
        name: item.name
      },
      create: {
        handle: item.handle,
        name: item.name,
        image: item.image,
        description: item.desc
      }
    });
    console.log(`✅ NOIR Activated for: ${result.name}`);
  }

  console.log('✨ North Mind brand sync complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
