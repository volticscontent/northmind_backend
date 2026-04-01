import prisma from '../src/lib/prisma';

async function main() {
  const title = "Men’s 1996 Retro Nuptse Jacket";
  const handle = "retro-nuptse-jacket";
  
  const images = [
    "https://northmind.store/cdn/shop/files/North_Face_-_Men_s_1996_Retro_Nuptse_Jacket_3.png",
    "https://northmind.store/cdn/shop/files/NorthFace-Men_s1996RetroNuptseJacket_1.png",
    "https://northmind.store/cdn/shop/files/North_Face_-_Men_s_1996_Retro_Nuptse_Jacket_7.png",
    "https://northmind.store/cdn/shop/files/North_Face_-_Men_s_1996_Retro_Nuptse_Jacket_4.png",
    "https://northmind.store/cdn/shop/files/North_Face_-_Men_s_1996_Retro_Nuptse_Jacket_6.png",
    "https://northmind.store/cdn/shop/files/North_Face_-_Men_s_1996_Retro_Nuptse_Jacket_5.png",
    "https://northmind.store/cdn/shop/files/North_Face_-_Men_s_1996_Retro_Nuptse_Jacket_5_ef7509ec-9fe2-4a97-ae61-7c52453fed5b.png",
    "https://northmind.store/cdn/shop/files/North_Face_-_Men_s_1996_Retro_Nuptse_Jacket_3_e9970f6c-d4f7-4cde-afac-c63a81b0c387.png",
    "https://northmind.store/cdn/shop/files/North_Face_-_Men_s_1996_Retro_Nuptse_Jacket_2.png",
    "https://northmind.store/cdn/shop/files/North_Face_-_Men_s_1996_Retro_Nuptse_Jacket.png"
  ];

  const description = `The 1996 Retro Nuptse Jacket is one of The North Face’s most iconic pieces, originally designed for extreme mountain expeditions and now recognized worldwide as a timeless streetwear and lifestyle essential.
Inspired by the original 1996 design, this jacket preserves its signature boxy silhouette, bold quilted panels and rugged aesthetic, while incorporating modern materials for everyday comfort and performance.
Crafted from recycled nylon ripstop, it features a water-resistant finish that helps protect against light rain and moisture. The 700 fill power goose down insulation delivers exceptional warmth, lightweight comfort and reliable thermal performance in cold conditions.
Designed for versatility, the jacket includes a stowable hood hidden in the collar, secure zippered hand pockets, and an adjustable hem to block out wind and retain heat. Embroidered The North Face® logos on the chest and back complete the iconic look.`;

  const highlights = [
    { title: "Classic Heritage", text: "Classic design inspired by the original 1996 model with relaxed boxy fit." },
    { title: "Premium Insulation", text: "700 fill power goose down insulation for superior warmth." },
    { title: "Weather Resistant", text: "Recycled nylon ripstop outer fabric with water-resistant finish." },
    { title: "Functional Design", text: "Stowable hood inside the collar, secure zippered hand pockets, and adjustable hem." }
  ];

  const productData = {
    nome: title,
    handle,
    descricao: description,
    preco: 39.00,
    precoOriginal: 78.00,
    fotoPrincipal: images[0],
    fotos: images,
    videos: [],
    collection: "Outerwear",
    totalAvaliacoes: 527,
    mediaAvaliacoes: 4.9,
    publicado: true,
    opcoesTamanho: ["S", "M", "L", "XL", "XXL"],
    opcoesCor: [],
    highlights
  };

  // Find by handle or similar name
  const existingProduct = await prisma.produto.findFirst({
    where: {
      OR: [
        { handle: handle },
        { nome: { contains: "Nuptse", mode: 'insensitive' } }
      ]
    }
  });

  if (existingProduct) {
    console.log(`Product found (ID: ${existingProduct.id}). Updating...`);
    await prisma.produto.update({
      where: { id: existingProduct.id },
      data: productData
    });
  } else {
    console.log("Product doesn't exist! Creating...");
    await prisma.produto.create({
      data: productData
    });
  }

  console.log("✅ Successfully imported Men’s 1996 Retro Nuptse Jacket!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
