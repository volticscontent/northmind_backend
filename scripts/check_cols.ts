import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const collections = await prisma.collection.findMany();
  console.log('--- ALL COLLECTIONS ---');
  collections.forEach(c => {
    console.log(`Name: ${c.name}, Handle: ${c.handle}, Image: ${c.image || 'MISSING'}`);
  });
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
