import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const collections = [
    {
      name: "Fragrances",
      handle: "fragrances",
      description: "Signature scents and niche perfumery for the modern mind.",
      image: "https://r2.northmind.com/collections/fragrances-cover.jpg"
    },
    {
      name: "Jackets",
      handle: "jackets",
      description: "Heritage leather and artisan-crafted outerwear.",
      image: "https://r2.northmind.com/collections/jackets-cover.jpg"
    },
    {
      name: "T-Shirts",
      handle: "t-shirts",
      description: "Premium sustainable cotton essentials with a contemporary fit.",
      image: "https://r2.northmind.com/collections/tshirts-cover.jpg"
    },
    {
      name: "Special Promo",
      handle: "special-promo",
      description: "Exclusive seasonal offers and limited edition drops.",
      image: "https://r2.northmind.com/collections/promo-cover.jpg"
    },
    {
      name: "Kits",
      handle: "kits",
      description: "Curated sets designed for the complete North Mind experience.",
      image: "https://r2.northmind.com/collections/kits-cover.jpg"
    }
  ];

  console.log('🚀 Seeding core collections...');

  for (const col of collections) {
    const result = await prisma.collection.upsert({
      where: { handle: col.handle },
      update: {
        name: col.name,
        description: col.description
      },
      create: {
        name: col.name,
        handle: col.handle,
        description: col.description,
        image: col.image
      }
    });
    console.log(`✅ Created/Updated collection: ${result.name}`);
  }

  console.log('✨ Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
