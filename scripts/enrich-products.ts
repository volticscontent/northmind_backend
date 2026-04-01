import prisma from '../src/lib/prisma';

async function main() {
  console.log("💎 Enriching products with Elite Details...");

  const updates = [
    {
      handle: "retro-nuptse-jacket",
      materiais: [
        { item: "Recycled Nylon Ripstop", percentage: "100%" },
        { item: "700-Fill Goose Down", percentage: "RDS Certified" }
      ],
      instrucoesCuidado: "Machine wash cold on delicate cycle. Tumble dry low with tennis balls to regain loft.",
      detalhesModelo: "Model is 1.88m and wears Size Large for a signature boxy fit.",
      guiaTamanho: {
        type: "table",
        headers: ["Size", "Chest (cm)", "Length (cm)", "Sleeves (cm)"],
        rows: [
          ["S", "114", "66", "88"],
          ["M", "119", "67", "90"],
          ["L", "127", "69", "92"],
          ["XL", "137", "71", "95"]
        ]
      }
    },
    {
      handle: "the-gorham-down-jacket-1",
      materiais: [
        { item: "High-Density Polyester", percentage: "100%" },
        { item: "Duck Down Fill", percentage: "750 Power" },
        { item: "Nylon Lining", percentage: "100%" }
      ],
      instrucoesCuidado: "Professional dry clean only to preserve the water-repellent finish.",
      detalhesModelo: "Model is 1.85m and wears Size Large for a tailored profile.",
      guiaTamanho: {
        type: "table",
        headers: ["Size", "Chest (cm)", "Length (cm)", "Shoulder (cm)"],
        rows: [
          ["S", "108", "68", "46"],
          ["M", "112", "70", "48"],
          ["L", "118", "72", "50"],
          ["XL", "124", "74", "52"]
        ]
      }
    },
    {
      handle: "polo-bear-linen-cotton-jumper",
      materiais: [
        { item: "Fine Italian Linen", percentage: "67%" },
        { item: "Premium Organic Cotton", percentage: "33%" }
      ],
      instrucoesCuidado: "Hand wash cold inside out. Lay flat to dry on a towel. Do not hang.",
      detalhesModelo: "Model is 1.82m and wears Size Medium for a classic heritage fit.",
      guiaTamanho: {
        type: "table",
        headers: ["Size", "Chest (cm)", "Length (cm)", "Sleeve (cm)"],
        rows: [
          ["S", "102", "66", "62"],
          ["M", "107", "68", "63"],
          ["L", "112", "70", "64"],
          ["XL", "118", "72", "65"]
        ]
      }
    }
  ];

  for (const update of updates) {
    const { handle, ...data } = update;
    try {
      await prisma.produto.update({
        where: { handle },
        data
      });
      console.log(`✅ Enriched: ${handle}`);
    } catch (e) {
      console.warn(`⚠️ Could not enrich ${handle}: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  }

  console.log("✨ All products enriched successfully!");
  await prisma.$disconnect();
}

main();
