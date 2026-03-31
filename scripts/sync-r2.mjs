/**
 * Script de Sincronização: Upload de Fotos para R2 + Sync de Coleções
 * 
 * Execução: node scripts/sync-r2.mjs
 * (Rodar a partir da pasta /backend)
 * 
 * O que faz:
 * 1. Lê todas as imagens de public/assets/products/
 * 2. Faz upload para o Cloudflare R2 organizadas por coleção
 * 3. Atualiza o banco de dados com as novas URLs do R2
 * 4. Garante que as coleções "Jackets" e "Silent Warmth" existam no backend
 */

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar .env do backend
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const prisma = new PrismaClient();

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME || "northmind";
const PUBLIC_URL = process.env.R2_PUBLIC_URL || "https://pub-7cbb9b15243a4822bb8f1cab2913dd00.r2.dev";

// Mapa de coleções com metadados para sincronizar no backend
const COLLECTIONS = [
  {
    name: "Jackets",
    handle: "jackets",
    description: "Premium heritage outerwear built for endurance and style.",
    image: "", // Será preenchida com a primeira foto da coleção
  },
  {
    name: "Silent Warmth",
    handle: "silent-warmth",
    description: "Luxurious knitwear crafted from the finest wool and cashmere blends.",
    image: "",
  },
];

// Dados dos produtos (correspondem ao products.json)
const PRODUCTS_DIR = path.join(__dirname, "..", "..", "public", "assets", "products");

async function uploadFile(filePath, key) {
  const fileBuffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mimeMap = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".mp4": "video/mp4",
    ".mov": "video/quicktime",
  };

  console.log(`  ⬆️  Uploading: ${key} (${(fileBuffer.length / 1024).toFixed(1)}KB)`);

  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: fileBuffer,
    ContentType: mimeMap[ext] || "application/octet-stream",
  }));

  const url = `${PUBLIC_URL}/${key}`;
  console.log(`  ✅ Done: ${url}`);
  return url;
}

async function main() {
  console.log("=== North Mind — Sincronização R2 + Coleções ===\n");

  // ─── PASSO 1: Sincronizar Coleções ───
  console.log("📦 Passo 1: Sincronizando coleções no banco de dados...\n");

  for (const col of COLLECTIONS) {
    const result = await prisma.collection.upsert({
      where: { handle: col.handle },
      update: { name: col.name, description: col.description },
      create: { name: col.name, handle: col.handle, description: col.description },
    });
    console.log(`  ✅ Coleção "${col.name}" sincronizada (ID: ${result.id})`);
  }

  // ─── PASSO 2: Upload de Fotos para R2 ───
  console.log("\n📸 Passo 2: Fazendo upload de fotos para o Cloudflare R2...\n");

  // Ler todos os produtos do banco
  const products = await prisma.produto.findMany();
  console.log(`  Encontrados ${products.length} produtos no banco.\n`);

  const updatedProducts = [];

  for (const product of products) {
    const currentPhotos = product.fotos || [];
    const newPhotos = [];

    console.log(`\n🔄 Processando: ${product.nome}`);

    for (const photoPath of currentPhotos) {
      // Se já é uma URL do R2, pular
      if (photoPath.startsWith("http")) {
        console.log(`  ⏭️  Já é URL remota: ${photoPath}`);
        newPhotos.push(photoPath);
        continue;
      }

      // Construir o caminho local (removendo /assets/products/ do path)
      const fileName = path.basename(photoPath);
      const localPath = path.join(PRODUCTS_DIR, fileName);

      if (!fs.existsSync(localPath)) {
        console.log(`  ⚠️  Arquivo não encontrado: ${localPath}`);
        newPhotos.push(photoPath); // Manter o path original
        continue;
      }

      // Organizar por coleção no R2
      const collectionSlug = (product.collection || "uncategorized")
        .toLowerCase()
        .replace(/\s+/g, "-");
      const key = `products/${collectionSlug}/${product.handle}-${fileName}`;

      const url = await uploadFile(localPath, key);
      newPhotos.push(url);
    }

    // Atualizar o produto no banco com as novas URLs
    if (JSON.stringify(newPhotos) !== JSON.stringify(currentPhotos)) {
      await prisma.produto.update({
        where: { id: product.id },
        data: { fotos: newPhotos },
      });
      console.log(`  💾 Banco atualizado com ${newPhotos.length} foto(s) do R2.`);
      updatedProducts.push({ nome: product.nome, fotos: newPhotos });
    }
  }

  // ─── PASSO 3: Atualizar imagem da coleção ───
  console.log("\n\n🖼️  Passo 3: Definindo imagens das coleções...\n");

  for (const col of COLLECTIONS) {
    // Pegar a primeira foto do primeiro produto da coleção
    const firstProduct = await prisma.produto.findFirst({
      where: { collection: col.name },
    });

    if (firstProduct?.fotos?.[0]) {
      await prisma.collection.update({
        where: { handle: col.handle },
        data: { image: firstProduct.fotos[0] },
      });
      console.log(`  ✅ Coleção "${col.name}" → imagem: ${firstProduct.fotos[0]}`);
    }
  }

  // ─── RESUMO ───
  console.log("\n\n=== RESUMO ===");
  console.log(`✅ ${COLLECTIONS.length} coleções sincronizadas`);
  console.log(`✅ ${updatedProducts.length} produtos atualizados com URLs do R2`);
  console.log(`🪣 Bucket: ${BUCKET}`);
  console.log(`🌐 URL Pública: ${PUBLIC_URL}`);
  console.log("\n🎉 Sincronização completa!\n");
}

main()
  .catch((e) => {
    console.error("\n❌ ERRO:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
