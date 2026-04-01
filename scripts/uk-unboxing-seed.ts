import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function unboxingSeed() {
  console.log("📦 Starting UK Elite Seed v3.1 (Unboxing Edition)...");

  try {
    // 1. PHASE 0: CRITICAL PURGE (DUPLICATE NAMES)
    console.log("🧹 Running Deep Purge (Names)...");
    const allProducts = await prisma.produto.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const seenNames = new Set();
    const idsToDelete = [];

    for (const p of allProducts) {
      if (seenNames.has(p.nome)) {
        idsToDelete.push(p.id);
      } else {
        seenNames.add(p.nome);
      }
    }

    if (idsToDelete.length > 0) {
      await prisma.produto.deleteMany({
        where: { id: { in: idsToDelete } }
      });
      console.log(`🗑️ Removed ${idsToDelete.length} duplicate clones by name.`);
    }

    // 2. Clear old reviews
    await prisma.comentario.deleteMany({});
    console.log("🧹 Cleared previous reviews.");

    // 3. User Ensure
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
    
    // 4. UNBOXING REVIEW POOL
    const reviewPool = [
      { 
        texto: "Top-notch quality. The zipper is sturdy and the fabric feels heavy and premium. Proper heritage piece.", 
        rating: 5, 
        name: "Henry Cavil (London)",
        foto: "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&q=80&w=400" // Close zip/detail
      },
      { 
        texto: "Absolutely chuffed with the detail. Even the inner lining is impeccable. Super fast delivery to York.", 
        rating: 5, 
        name: "William B.",
        foto: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&q=80&w=400" // Folded/Texture
      },
      { 
        texto: "The stitching is perfectly aligned. It's rare to find this level of quality nowadays. A solid buy.", 
        rating: 5, 
        name: "Grace P.",
        foto: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=400" // Fabric close up
      },
      { 
        texto: "The warmth it provides is superb for the British winter. Really stands out from regular high street jackets.", 
        rating: 5, 
        name: "Thomas Shelbi",
        foto: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80&w=400" // Product on flat surface
      },
      { 
        texto: "The packaging was very premium and the jacket was neatly folded. Feels like a proper luxury experience.", 
        rating: 5, 
        name: "Alistair R.",
        foto: "https://images.unsplash.com/photo-1607082348124-0a96f2a4b9da?auto=format&fit=crop&q=80&w=400" // Packaging/Box feel
      }
    ];

    for (const product of products) {
      const shuffled = reviewPool.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 3 + Math.floor(Math.random() * 2));

      for (const review of selected) {
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
      console.log(`✅ Unboxing Reviews Added: ${product.nome}`);
    }

    console.log("\n✨ UK Elite Unboxing Seed Complete!");
  } catch (error: any) {
    console.error("❌ ERROR:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

unboxingSeed();
