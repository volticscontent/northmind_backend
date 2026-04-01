import { PrismaClient } from "@prisma/client";
const fs = require('fs');
const prisma = new PrismaClient();

async function syncEliteData() {
  console.log("🚀 Starting Elite Data Sync 4.2 (ALL FIELDS - Deep Extraction)...");

  try {
    const shopifyData = JSON.parse(fs.readFileSync('../data/shopify_full_catalog.json', 'utf8'));
    
    for (const sProduct of shopifyData.products) {
      console.log(`\n🧵 Deep Syncing: ${sProduct.title}`);
      
      const dbProduct = await prisma.produto.findUnique({
        where: { handle: sProduct.handle }
      });

      if (!dbProduct) continue;

      const html = sProduct.body_html || "";
      
      // 1. Branding (Story)
      const pMatch = html.match(/<p[^>]*>([\s\S]*?)<\/p>/);
      let branding = pMatch ? pMatch[1].replace(/<\/?[^>]+(>|$)/g, "").trim() : "";
      if (branding.toLowerCase().includes("size") || branding.toLowerCase().includes("washable")) {
        branding = "";
      }

      // 2. Technical specs (Bullets)
      const specs: string[] = [];
      const liMatches = html.match(/<li[^>]*>([\s\S]*?)<\/li>/g);
      if (liMatches) {
        liMatches.forEach((match: string) => {
          const text = match.replace(/<\/?[^>]+(>|$)/g, "").replace(/\s+/g, " ").trim();
          if (text && text.length > 5) specs.push(text);
        });
      }

      // 3. Fabrication & Care (New Logic)
      let careText = "Machine washable. Imported.";
      if (html.toLowerCase().includes("dry clean")) careText = "Dry clean only. Imported.";
      
      // Extract materials like "Shell: 100% polyester"
      const materials: any[] = [];
      const shellMatch = html.match(/Shell:\s*([^.<]*)/i) || html.match(/Composition:\s*([^.<]*)/i);
      const liningMatch = html.match(/Lining:\s*([^.<]*)/i);
      const fillMatch = html.match(/Fill:\s*([^.<]*)/i);

      if (shellMatch) materials.push({ item: "Shell", percentage: shellMatch[1].trim() });
      if (liningMatch) materials.push({ item: "Lining", percentage: liningMatch[1].trim() });
      if (fillMatch) materials.push({ item: "Fill", percentage: fillMatch[1].trim() });
      
      // If no specific materials found, use general list
      if (materials.length === 0) {
        materials.push({ item: "Premium Material", percentage: "100% High-Grade" });
      }

      // 4. Update Database
      await prisma.produto.update({
        where: { id: dbProduct.id },
        data: {
          descricao: branding,
          especificacoes: specs,
          materiais: materials,
          instrucoesCuidado: careText
        }
      });

      console.log(`✅ ${sProduct.handle}: Specs (${specs.length}), Materials (${materials.length}), Care updated.`);
    }

    console.log("\n✨ Elite Data Sync 4.2 Completed!");
  } catch (e: any) {
    console.error("❌ ERROR:", e.message);
  }
}

syncEliteData().catch(console.error);
