import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function eliteVolumeSeed() {
  console.log("🇬🇧 Starting UK Elite Seed v4.0 (Volume & Purge)...");

  try {
    const eliteHandles = [
      'the-gorham-down-jacket-1', 
      'retro-nuptse-jacket', 
      'the-iconic-flag-sweater', 
      'bi-swing-jacket', 
      'polo-bear-linen-cotton-jumper', 
      'cable-knit-wool-cashmere-jumper', 
      'cable-knit-quarter-zip-jumper', 
      'double-knit-quarter-zip-pullover', 
      'the-beaton-quilted-jacket-625555', 
      'the-wyoming-corduroy-down-jacket-100058106', 
      'the-colden-packable-down-jacket', 
      'the-wyoming-ripstop-down-jacket-1765483663005', 
      'the-gorham-glossed-down-jacket-1765483665042'
    ];

    // 1. FINAL PURGE
    console.log("🧹 Running Permanent Purge...");
    const deadProducts = await prisma.produto.deleteMany({
      where: {
        handle: { notIn: eliteHandles }
      }
    });
    console.log(`🗑️ Removed ${deadProducts.count} redundant products.`);

    // 2. Clear old reviews
    await prisma.comentario.deleteMany({});
    console.log("🧹 Cleared old reviews.");

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
    
    // 4. LARGE REVIEW POOL (UK PREMIUM)
    const reviewPool = [
      "Absolutely brilliant quality. The fit is superb and it feels like a proper heritage piece.",
      "Top-notch craftsmanship. Delivery to London was surprisingly fast. Highly recommend this piece.",
      "The material is heavy and premium, just what you'd expect from North Mind. A solid 5 stars.",
      "Proper winter essential. The internal lining is very comfortable and the finishing is impeccable.",
      "I was a bit skeptical at first but the unboxing experience was pure luxury. Really impressed.",
      "Chuffed with this purchase. It stands out from everything else on the high street.",
      "The stitching is perfect. Fine attention to detail and a very comfortable fit.",
      "Superior warmth and style. It's been my go-to jacket for weeks now. Proper quality.",
      "Elegant and functional. Manchester winters are tough but this holds up perfectly.",
      "Really posh design. It has that classic British feel but with a modern edge.",
      "Best investment this season. The quality justifies the price point for me.",
      "Superb customer service and the product is even better in person. Stunning piece."
    ];

    const names = [
      "Arthur P.", "Sienna W.", "Oliver S.", "Charlotte R.", "Leo F.", 
      "James G.", "Isabella M.", "Harry T.", "Mia B.", "George D.", 
      "Florence C.", "Noah J.", "Thomas S."
    ];

    for (const product of products) {
      // 8-10 reviews per product for high volume
      const count = 8 + Math.floor(Math.random() * 4);
      
      for (let i = 0; i < count; i++) {
        const randomText = reviewPool[Math.floor(Math.random() * reviewPool.length)];
        const randomName = names[Math.floor(Math.random() * names.length)];
        const randomRating = Math.random() > 0.3 ? 5 : 4;
        
        const randomDate = new Date();
        randomDate.setDate(randomDate.getDate() - (1 + Math.floor(Math.random() * 60)));

        await prisma.comentario.create({
          data: {
            texto: randomText,
            rating: randomRating,
            userName: randomName,
            fotos: [], // No photos initially
            videoUrl: null, // No video initially
            produtoId: product.id,
            userId: user.id,
            createdAt: randomDate
          }
        });
      }
      
      await prisma.produto.update({
        where: { id: product.id },
        data: {
          mediaAvaliacoes: 4.8,
          totalAvaliacoes: count
        }
      });
      console.log(`✅ Massified Reviews: ${product.nome} (${count} items)`);
    }

    console.log("\n✨ UK Elite Seed v4.0 Complete!");
  } catch (error: any) {
    console.error("❌ ERROR:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

eliteVolumeSeed();
