import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import * as fs from "fs";
import * as path from "path";
import "dotenv/config";

const prisma = new PrismaClient();

async function main() {
  const productsFilePath = path.join(__dirname, "..", "data", "products.json");
  const productsData = JSON.parse(fs.readFileSync(productsFilePath, "utf-8"));

  // 1. Seed Admin & User
  console.log("Seeding admin and user...");
  const userEmail = "volticsbr@gmail.com";
  
  const hashedAdminPass = await bcrypt.hash("admin123", 12);
  const hashedUserPass = await bcrypt.hash("user123", 12);
  
  // Create Admin
  await prisma.admin.upsert({
    where: { email: userEmail },
    update: {
      hashedPassword: hashedAdminPass
    },
    create: {
      email: userEmail,
      name: "Nathan Admin",
      hashedPassword: hashedAdminPass,
    },
  });

  // Create Standard User (Customer)
  await prisma.user.upsert({
    where: { email: userEmail },
    update: {
      name: "Nathan Customer",
      hashedPassword: hashedUserPass,
      telefone: "+55 11 99999-9999",
      localizacao: "São Paulo, Brasil"
    },
    create: {
      email: userEmail,
      name: "Nathan",
      hashedPassword: hashedUserPass,
      telefone: "+55 11 99999-9999",
      localizacao: "São Paulo, Brasil",
      statusUltimoPedido: "Nenhum pedido ainda"
    },
  });

  // 2. Seed Collections
  console.log("Seeding collections...");
  const uniqueCollections = Array.from(new Set(productsData.products.map((p: any) => p.collection)));

  for (const collectionName of uniqueCollections as string[]) {
    const handle = collectionName.toLowerCase().replace(/\s+/g, '-');
    await prisma.collection.upsert({
      where: { handle },
      update: { name: collectionName },
      create: {
        name: collectionName,
        handle,
        description: `All products in ${collectionName}`
      }
    });
  }

  // 3. Seed Products
  console.log("Seeding products...");

  for (const product of productsData.products) {
    await prisma.produto.upsert({
      where: { handle: product.handle },
      update: {
        nome: product.title,
        descricao: product.description,
        preco: product.price,
        precoOriginal: product.originalPrice,
        collection: product.collection,
        fotos: product.images,
      },
      create: {
        id: product.id,
        nome: product.title,
        handle: product.handle,
        descricao: product.description,
        preco: product.price,
        precoOriginal: product.originalPrice,
        collection: product.collection,
        fotos: product.images,
      },
    });
  }

  console.log("Seed finished successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
