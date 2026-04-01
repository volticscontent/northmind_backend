import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🏺 Starting Elite Fragrance Import with Multi-Pricing...');

  const dataPath = path.join(__dirname, '../../data/unified_products_en_gbp.json');
  const rawData = fs.readFileSync(dataPath, 'utf-8');
  const { products } = JSON.parse(rawData);

  // Elite Olfactory Mapping (Famous Perfumes)
  const olfactoryProfiles: Record<string, { specs: string[], materials: any[] }> = {
    'creed-aventus': {
      specs: ['Top: Pineapple, Bergamot, Blackcurrant', 'Heart: Birch, Patchouli, Moroccan Jasmine', 'Base: Musk, Oakmoss, Ambergris'],
      materials: [{ item: 'Rare Essential Oils', percentage: '22%' }, { item: 'Fine Perfume Alcohol', percentage: '78%' }]
    },
    'sauvage': {
      specs: ['Top: Calabrian Bergamot, Pepper', 'Heart: Sichuan Pepper, Lavender, Pink Pepper', 'Base: Ambroxan, Cedar, Labdanum'],
      materials: [{ item: 'Fragrance Concentrate', percentage: '18%' }, { item: 'Deionized Water', percentage: '2%' }, { item: 'Perfumers Alcohol', percentage: '80%' }]
    },
    'bleu-de-chanel': {
      specs: ['Top: Grapefruit, Lemon, Mint', 'Heart: Ginger, Nutmeg, Jasmine', 'Base: Incense, Vetiver, Sandalwood'],
      materials: [{ item: 'Luxury Fragrance Oils', percentage: '20%' }, { item: 'Pure Ethyl Alcohol', percentage: '80%' }]
    },
    '212-men': {
      specs: ['Top: Green Notes, Spices, Bergamot', 'Heart: Ginger, Gardenia, Violet', 'Base: Musk, Sandalwood, Incense'],
      materials: [{ item: 'Aromatic Compounds', percentage: '15%' }, { item: 'Base Elements', percentage: '85%' }]
    },
    // Default template for others (High-end)
    'default': {
      specs: ['Top: Citrus Nuance, Bergamot', 'Heart: Floral Core, Precious Spices', 'Base: Warm Oud, Amber, Sandalwood'],
      materials: [{ item: 'Artisanal Fragrance Oil', percentage: '18%' }, { item: 'Organic Perfume Base', percentage: '82%' }]
    }
  };

  let importedCount = 0;
  let specialOfferCount = 0;

  for (const p of products) {
    const titleLower = p.title.toLowerCase();
    const isSpecialOffer = titleLower.includes('set') || 
                           titleLower.includes('kit') || 
                           titleLower.includes('pack') || 
                           titleLower.includes('trio') ||
                           titleLower.includes(' 3 ') ||
                           p.is_combo === true;

    const collection = isSpecialOffer ? 'special offer' : 'fragrances';
    if (isSpecialOffer) specialOfferCount++;

    // Find the best olfactory profile
    const profileKey = Object.keys(olfactoryProfiles).find(k => p.handle.includes(k)) || 'default';
    const profile = olfactoryProfiles[profileKey];

    // Remap Image Paths
    const remapImages = p.images.map((img: string) => {
      const parts = img.split('/');
      const folder = parts[parts.length - 2];
      const filename = parts[parts.length - 1];
      return `/assets/products/fragrances/${folder}/${filename}`;
    });

    const basePrice = Number(p.price.regular);
    
    // Dynamic Pricing Engine per Size
    const variants = isSpecialOffer 
      ? [
          { label: 'Set of 3 Bundle', price: basePrice, originalPrice: basePrice * 1.5, sku: `${p.sku}-BUNDLE` }
        ]
      : [
          { label: '50ml', price: basePrice, originalPrice: basePrice * 1.35, sku: `${p.sku}-50ML` },
          { label: '100ml', price: Math.round(basePrice * 1.45 * 100) / 100, originalPrice: Math.round(basePrice * 1.45 * 1.35 * 100) / 100, sku: `${p.sku}-100ML` },
          { label: '150ml', price: Math.round(basePrice * 1.85 * 100) / 100, originalPrice: Math.round(basePrice * 1.85 * 1.35 * 100) / 100, sku: `${p.sku}-150ML` }
        ];

    const description = `Experience the profound depth and sophisticated character of North Mind ${p.title}. Crafted for the discerning individual, this fragrance balances classic heritage with a contemporary noir edge.`;

    await prisma.produto.upsert({
      where: { handle: p.handle },
      update: {
        nome: p.title,
        descricao: description,
        preco: variants[0].price, // Main price is the first variant (base)
        precoOriginal: variants[0].originalPrice,
        collection: collection,
        fotos: remapImages,
        fotoPrincipal: remapImages[0] || null,
        especificacoes: profile.specs,
        materiais: profile.materials as any,
        variantes: variants as any,
        publicado: true,
        mediaAvaliacoes: 4.8 + Math.random() * 0.2,
        totalAvaliacoes: 24 + Math.floor(Math.random() * 60),
        opcoesTamanho: variants.map(v => v.label),
        highlights: [
          { icon: 'Shield', title: 'Authenticity Guaranteed', text: 'Original designer fragrance in museum-quality packaging.' },
          { icon: 'Package', title: 'Hermetic Seal', text: 'Preserving volatile compounds for peak performance.' }
        ]
      },
      create: {
        nome: p.title,
        handle: p.handle,
        descricao: description,
        preco: variants[0].price,
        precoOriginal: variants[0].originalPrice,
        collection: collection,
        fotos: remapImages,
        fotoPrincipal: remapImages[0] || null,
        especificacoes: profile.specs,
        materiais: profile.materials as any,
        variantes: variants as any,
        publicado: true,
        mediaAvaliacoes: 4.9,
        totalAvaliacoes: 45,
        opcoesTamanho: variants.map(v => v.label),
        highlights: [
          { icon: 'Shield', title: 'Authenticity Guaranteed', text: 'Original designer fragrance in museum-quality packaging.' },
          { icon: 'Package', title: 'Hermetic Seal', text: 'Preserving volatile compounds for peak performance.' }
        ]
      }
    });

    importedCount++;
  }

  console.log(`✅ Success! Imported ${importedCount} fragrances with Multi-Pricing.`);
  console.log(`🏛️ Collection Fragrances: ${importedCount - specialOfferCount}`);
  console.log(`⚖️ Collection Special Offer: ${specialOfferCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
