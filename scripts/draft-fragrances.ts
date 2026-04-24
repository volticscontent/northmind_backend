import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const collectionsToDraft = ['fragrances', 'Fragrance Sets'];

  console.log("Draftando coleções e seus produtos...");

  for (const coll of collectionsToDraft) {
    // 1. Atualizar a coleção para publicado: false
    const updatedCollection = await prisma.collection.updateMany({
      where: {
        name: {
          equals: coll,
          mode: 'insensitive',
        }
      },
      data: {
        publicado: false
      }
    });
    console.log(`Coleção '${coll}' atualizada: ${updatedCollection.count} registro(s) modificado(s).`);

    // 2. Atualizar os produtos dessa coleção para publicado: false
    const updatedProducts = await prisma.produto.updateMany({
      where: {
        collection: {
          equals: coll,
          mode: 'insensitive',
        }
      },
      data: {
        publicado: false
      }
    });
    console.log(`Produtos da coleção '${coll}' atualizados: ${updatedProducts.count} registro(s) modificado(s).`);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
