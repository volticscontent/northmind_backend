import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function syncReviews() {
  console.log("🚀 Starting smart review synchronization (Grouping by Title)...");

  try {
    // 1. Get all reviews to calculate stats by product name
    const allReviews = await prisma.comentario.findMany({
      include: { produto: true }
    });

    const statsByTitle: Record<string, { total: number, sum: number }> = {};

    allReviews.forEach(r => {
      const title = r.produto.nome;
      if (!statsByTitle[title]) statsByTitle[title] = { total: 0, sum: 0 };
      statsByTitle[title].total += 1;
      statsByTitle[title].sum += r.rating;
    });

    console.log(`📊 Calculated stats for ${Object.keys(statsByTitle).length} unique product titles.`);

    // 2. Update ALL products in the database
    const products = await prisma.produto.findMany({
      select: { id: true, nome: true }
    });

    for (const product of products) {
      const stats = statsByTitle[product.nome];
      const totalAvaliacoes = stats ? stats.total : 0;
      const mediaAvaliacoes = stats ? (stats.sum / stats.total) : 5.0;

      await prisma.produto.update({
        where: { id: product.id },
        data: {
          totalAvaliacoes,
          mediaAvaliacoes,
        },
      });

      if (totalAvaliacoes > 0) {
        console.log(`✅ Updated ${product.nome} (${product.id}): ${totalAvaliacoes} reviews, ${mediaAvaliacoes.toFixed(1)} average.`);
      }
    }

    console.log("✨ Smart Synchronization completed successfully!");
  } catch (error) {
    console.error("❌ Sync failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

syncReviews();
