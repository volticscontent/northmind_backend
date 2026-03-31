import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const updates = [
    { 
        handle: "fragrances", 
        name: "Fragrances", 
        image: "/collections/fragrances.png", 
        desc: "Sophisticated modern scents. The essence of the North Mind man." 
    },
    { 
        handle: "jackets", 
        name: "Jackets", 
        image: "/collections/jackets.png", 
        desc: "Heritage leather and premium tailoring. Balanced for the modern silhouette." 
    },
    { 
        handle: "t-shirts", 
        name: "T-Shirts", 
        image: "/collections/t-shirts.png", 
        desc: "Essential minimalist luxury. High-fidelity textures for the daily grind." 
    },
    { 
        handle: "special-promo", 
        name: "Special Promo", 
        image: "/collections/special-promo.png", 
        desc: "Exclusive access to seasonal drops and limited archival pieces." 
    },
    { 
        handle: "kits", 
        name: "Kits", 
        image: "/collections/kits.png", 
        desc: "Voluminous urban winter wear and curated gift sets." 
    }
  ];

  console.log('🎞️ Activating BALANCED NOIR SOPHISTICATION...');

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
    console.log(`✅ BALANCED NOIR Activated for: ${result.name}`);
  }

  console.log('✨ North Mind visual sync complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
