import prisma from './src/lib/prisma';

async function check() {
  const products = await prisma.produto.findMany({
    select: { id: true, handle: true, nome: true, publicado: true }
  });
  console.log(JSON.stringify(products, null, 2));
}

check().catch(console.error).finally(() => prisma.$disconnect());
