import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function ukEliteSeed() {
  console.log("🇬🇧 Starting UK Elite Seed v3.0 (The Purge + Visual Reviews)...");

  try {
    // 1. PHASE 0: THE PURGE
    console.log("🧹 Running Database Cleanup...");
    const deadProducts = await prisma.produto.deleteMany({
      where: {
        OR: [
          { especificacoes: { equals: [] } },
          { fotos: { equals: [] } }
        ]
      }
    });
    console.log(`🗑️ Removed ${deadProducts.count} duplicate/empty products.`);

    // 2. Clear old reviews
    await prisma.comentario.deleteMany({});
    console.log("🧹 Cleared old Portuguese reviews.");

    // 3. Ensure User
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: "customer@northmind.store",
          hashedPassword: "mock-password-hash",
          name: "Elite Customer"
        }
      });
    }

    const products = await prisma.produto.findMany();
    console.log(`📦 Reviewing ${products.length} Elite products.`);

    const reviewPool = [
      { 
        texto: "Absolutely chuffed with this jacket. The heritage feel is undeniable and it holds up perfectly in the London rain.", 
        rating: 5, 
        name: "Arthur Penhaligon",
        foto: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400"
      },
      { 
        texto: "Proper quality. You can tell it's crafted to last. Worth every quid for the craftsmanship alone.", 
        rating: 5, 
        name: "Sienna W.",
        foto: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400"
      },
      { 
        texto: "The fit is spot on. Delivery to Manchester was incredibly fast. A superb addition to my winter wardrobe.", 
        rating: 5, 
        name: "Oliver Smith",
        foto: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80&w=400"
      },
      { 
        texto: "Top-notch material. The stitching is impeccable. Very pleased with the purchase.", 
        rating: 4, 
        name: "Charlotte R.",
        foto: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=400"
      },
      { 
        texto: "Love the minimalist design. It's both functional and stylish for everyday wear. Highly recommend.", 
        rating: 5, 
        name: "Leo Fitzgerald",
        foto: "https://images.unsplash.com/photo-1488161628813-04466f872be2?auto=format&fit=crop&q=80&w=400"
      }
    ];

    for (const product of products) {
      const shuffled = reviewPool.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 3 + Math.floor(Math.random() * 2));

      for (const review of selected) {
        // Randomize date (2 to 60 days ago)
        const randomDate = new Date();
        randomDate.setDate(randomDate.getDate() - (2 + Math.floor(Math.random() * 58)));

        await prisma.comentario.create({
          data: {
            texto: review.texto,
            rating: review.rating,
            userName: review.name,
            fotoUrl: review.foto,
            produtoId: product.id,
            userId: user.id,
            createdAt: randomDate
          }
        });
      }
      
      const avgRating = selected.reduce((acc, curr) => acc + curr.rating, 0) / selected.length;
      await prisma.produto.update({
        where: { id: product.id },
        data: {
          mediaAvaliacoes: avgRating,
          totalAvaliacoes: selected.length
        }
      });
      console.log(`✅ UK Reviews Added: ${product.nome}`);
    }

    console.log("\n✨ UK Elite Seed Complete!");
  } catch (error: any) {
    console.error("❌ ERROR:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

ukEliteSeed();
