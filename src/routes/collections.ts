import { Router } from "express";
import prisma from "../lib/prisma";
import { isAdmin } from "../middleware/auth";
import { slugify } from "../utils/slugify";

const router = Router();

// Listar coleções publicadas (Público)
router.get("/", async (req, res) => {
  try {
    let collections;
    try {
      collections = await (prisma.collection.findMany as any)({
        where: { publicado: true },
        orderBy: { createdAt: "desc" },
      });
    } catch {
      // Fallback: Prisma Client ainda sem o campo publicado (aguardando restart)
      collections = await prisma.collection.findMany({
        orderBy: { createdAt: "desc" },
      });
    }
    return res.json(collections);
  } catch (error) {
    console.error("GET_COLLECTIONS_ERROR", error);
    return res.status(500).json({ error: "Internal Error" });
  }
});

// Listar todas as coleções (Admin — inclui drafts)
router.get("/raw", isAdmin, async (req, res) => {
  try {
    const collections = await prisma.collection.findMany({
      orderBy: { createdAt: "desc" },
    });
    return res.json(collections);
  } catch (error) {
    console.error("GET_COLLECTIONS_RAW_ERROR", error);
    return res.status(500).json({ error: "Internal Error" });
  }
});

// Buscar coleção por handle (Público — retorna 404 se draft)
router.get("/handle/:handle", async (req, res) => {
  try {
    const collection = await prisma.collection.findFirst({
      where: { handle: req.params.handle, publicado: true },
    });
    if (!collection) return res.status(404).json({ error: "Not found" });
    return res.json(collection);
  } catch (error) {
    console.error("GET_COLLECTION_HANDLE_ERROR", error);
    return res.status(500).json({ error: "Internal Error" });
  }
});

// Upsert (criar ou atualizar) uma coleção
router.post("/upsert", isAdmin, async (req, res) => {
  try {
    const { id, name, description, image, productIds, publicado } = req.body;
    const slug = slugify(name);
    const data = {
      name,
      handle: slug,
      description,
      image,
      publicado: publicado !== undefined ? Boolean(publicado) : undefined,
    };

    let collection;
    if (id) {
      collection = await prisma.collection.update({
        where: { id },
        data,
      });
    } else {
      collection = await prisma.collection.create({
        data: { ...data, publicado: Boolean(publicado ?? true) },
      });
    }

    if (productIds && Array.isArray(productIds)) {
      await prisma.produto.updateMany({
        where: { collection: name },
        data: { collection: "" },
      });
      await prisma.produto.updateMany({
        where: { id: { in: productIds } },
        data: { collection: name },
      });
    }

    return res.json(collection);
  } catch (error: any) {
    console.error("UPSERT_COLLECTION_ERROR", error);
    if (error.code === "P2002") {
      return res.status(409).json({ error: "Collection with this name or handle already exists." });
    }
    return res.status(500).json({ error: "Internal Error" });
  }
});

// Atualizar apenas o status draft/publicado da coleção
router.post("/set-draft", isAdmin, async (req, res) => {
  try {
    const { id, publicado } = req.body;
    if (!id) return res.status(400).json({ error: "Collection id required" });

    const collection = await prisma.collection.update({
      where: { id },
      data: { publicado: Boolean(publicado) },
    });

    return res.json(collection);
  } catch (error) {
    console.error("SET_COLLECTION_DRAFT_ERROR", error);
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
      data: { publicado },
    });

    return res.json({ success: true });
  } catch (error) {
    console.error("COLLECTION_BULK_STATUS_ERROR", error);
    return res.status(500).json({ error: "Internal Error" });
  }
});

export default router;
