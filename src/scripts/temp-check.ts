import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("--- DB DIAGNOSTIC ---");
  const reviewsCount = await prisma.comentario.count();
  console.log("Total Reviews in DB:", reviewsCount);

  if (reviewsCount > 0) {
    const lastReviews = await prisma.comentario.findMany({
      take: 3,
      orderBy: { createdAt: "desc" }
    });

    for (const r of lastReviews) {
      const product = await prisma.produto.findUnique({
        where: { id: r.produtoId },
        select: { id: true, nome: true, handle: true, totalAvaliacoes: true }
      });
      console.log(`Review ID: ${r.id}`);
      console.log(`Product ID in Review: ${r.produtoId}`);
      console.log(`Product Found: ${product ? product.nome : "NULL"}`);
      if (product) {
        console.log(`Product Current Stats: Total=${product.totalAvaliacoes}`);
      }
      console.log("---");
    }
  }

  const productsWithRatings = await prisma.produto.findMany({
    where: { totalAvaliacoes: { gt: 0 } },
    select: { id: true, nome: true, totalAvaliacoes: true }
  });
  console.log("Products with totalAvaliacoes > 0:", productsWithRatings.length);
  for (const p of productsWithRatings) {
    console.log(`- ${p.nome}: ${p.totalAvaliacoes}`);
  }

  await prisma.$disconnect();
}

main();
