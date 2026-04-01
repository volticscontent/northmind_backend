import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function seedMockReviews() {
  console.log("🌟 Seeding Mock Reviews (Elite Style - Corrected)...");

  try {
    // 1. Ensure we have users
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: "customer@northmind.store",
          hashedPassword: "mock-password-hash",
          name: "Elite Customer"
        }
      });
      console.log("👤 Created a default Elite Customer.");
    }

    const products = await prisma.produto.findMany();
    console.log(`📦 Found ${products.length} products to review.`);

    const reviewPool = [
      { texto: "Incrível! A qualidade do material é superior a tudo que já comprei. O caimento é perfeito.", rating: 5, name: "Lucas Almeida" },
      { texto: "Peça essencial no guarda-roupa. Muito estilosa e o acabamento é de alto luxo.", rating: 5, name: "Mariana Costa" },
      { texto: "Chegou super rápido. A embalagem é um show à parte.", rating: 5, name: "James Sterling" },
      { texto: "Muito satisfeito. O tecido é pesado e de extrema qualidade. Vale cada centavo.", rating: 4, name: "Rafael M." },
      { texto: "Comprei o combo e foi o melhor investimento. Prático e elegante.", rating: 5, name: "Carolina S." },
      { texto: "Design impecável. Realmente transparece a herança britânica. Recomendo.", rating: 5, name: "Wilson T." },
      { texto: "Um pouco caro, mas a durabilidade justifica totalmente.", rating: 4, name: "Felipe G." },
      { texto: "Atendimento premium e o produto é sensacional. O melhor da North Mind.", rating: 5, name: "Nathan R." }
    ];

    for (const product of products) {
      // Randomly pick 3-4 reviews from the pool
      const shuffled = reviewPool.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 3 + Math.floor(Math.random() * 2));

      for (const review of selected) {
        await prisma.comentario.create({
          data: {
            texto: review.texto,
            rating: review.rating,
            userName: review.name,
            produtoId: product.id,
            userId: user.id
          }
        });
      }
      
      // Update product rating metadata
      const avgRating = selected.reduce((acc, curr) => acc + curr.rating, 0) / selected.length;
      await prisma.produto.update({
        where: { id: product.id },
        data: {
          mediaAvaliacoes: avgRating,
          totalAvaliacoes: selected.length
        }
      });
      
      console.log(`✅ Added ${selected.length} reviews to ${product.nome}`);
    }

    console.log("\n✨ Mock Reviews Seeding Completed!");
  } catch (error: any) {
    console.error("❌ SEED ERROR:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

seedMockReviews();
