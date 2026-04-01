import { Router } from "express";
import prisma from "../lib/prisma";
import { isAdmin } from "../middleware/auth"; // Importa o middleware
import { slugify } from "../utils/slugify";

const router = Router();

// Listar todas as coleções (Público)
router.get("/", async (req, res) => {
  console.log("Requisição GET /api/collections recebida.");
  try {
    const collections = await prisma.collection.findMany({
      orderBy: { createdAt: "desc" },
      // Adicionar contagem de produtos por coleção se necessário
      // include: {
      //   _count: {
      //     select: { products: true },
      //   },
      // },
    });
    return res.json(collections);
  } catch (error) {
    console.error("GET_COLLECTIONS_ERROR", error);
    return res.status(500).json({ error: "Internal Error" });
  }
});

// Upsert (criar ou atualizar) uma coleção
router.post("/upsert", isAdmin, async (req, res) => {
  try {
    const { id, name, description, image, productIds } = req.body;
    const slug = slugify(name);
    const data = { name, handle: slug, description, image };

    let collection;
    if (id) {
      collection = await prisma.collection.update({
        where: { id },
        data,
      });
    } else {
      collection = await prisma.collection.create({
        data,
      });
    }

    // Se houver lista de produtos, atualizamos as associações
    // Note: No modelo atual, Produto tem apenas o nome da coleção como string
    if (productIds && Array.isArray(productIds)) {
      // 1. Remover a coleção de todos os produtos que a tinham (limpa o estado anterior)
      await prisma.produto.updateMany({
        where: { collection: name },
        data: { collection: "" }
      });

      // 2. Adicionar a coleção aos produtos selecionados
      await prisma.produto.updateMany({
        where: { id: { in: productIds } },
        data: { collection: name }
      });
    }

    return res.json(collection);
  } catch (error: any) {
    console.error("UPSERT_COLLECTION_ERROR", error);
    if (error.code === 'P2002') { // Unique constraint violation
      return res.status(409).json({ error: "Collection with this name or handle already exists." });
    }
    return res.status(500).json({ error: "Internal Error" });
  }
});

// Deletar uma coleção
router.delete("/:id", isAdmin, async (req, res) => {
  try {
    await prisma.collection.delete({ where: { id: req.params.id } });
    return res.json({ success: true });
  } catch (error) {
    console.error("DELETE_COLLECTION_ERROR", error);
    return res.status(500).json({ error: "Internal Error" });
  }
});

// Atualizar status de todos os produtos de uma coleção (Draft/Live)
router.post("/bulk-status", isAdmin, async (req, res) => {
  try {
    const { collectionName, publicado } = req.body;
    if (!collectionName) return res.status(400).json({ error: "Collection name required" });

    await prisma.produto.updateMany({
      where: { collection: collectionName },
      data: { publicado }
    });

    return res.json({ success: true });
  } catch (error) {
    console.error("COLLECTION_BULK_STATUS_ERROR", error);
    return res.status(500).json({ error: "Internal Error" });
  }
});

export default router;
