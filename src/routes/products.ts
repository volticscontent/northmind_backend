import { Router } from "express";
import prisma from "../lib/prisma";
import { isAdmin } from "../middleware/auth";
import { slugify } from "../utils/slugify";

const router = Router();

// Listar todos os produtos (raw, para admin)
router.get("/raw", isAdmin, async (req, res) => {
  try {
    const products = await prisma.produto.findMany({
      orderBy: { createdAt: "desc" },
    });
    
    // Injetar fallback de foto e garantir que todos os campos dinâmicos sejam retornados
    const mapped = products.map(p => ({
      ...p,
      fotoPrincipal: p.fotoPrincipal || (p.fotos && p.fotos.length > 0 ? p.fotos[0] : null),
      publicado: p.publicado ?? true,
      opcoesTamanho: p.opcoesTamanho || ["S", "M", "L", "XL", "XXL"],
      opcoesCor: p.opcoesCor || [],
      highlights: p.highlights || []
    }));

    return res.json(mapped);
  } catch (error) {
    return res.status(500).json({ error: "Internal Error" });
  }
});

// Listar todos os produtos (mapeado, para frontend - APENAS PUBLICADOS)
router.get("/", async (req, res) => {
  try {
    const products = await prisma.produto.findMany({
      where: { publicado: true },
      orderBy: { createdAt: "desc" },
    });
    const mapped = products.map((p) => ({
      id: p.id,
      handle: p.handle,
      title: p.nome,
      description: p.descricao,
      price: p.preco,
      originalPrice: p.precoOriginal || 0,
      collection: p.collection,
      fotoPrincipal: p.fotoPrincipal || (p.fotos && p.fotos.length > 0 ? p.fotos[0] : null),
      images: p.fotos,
      videos: p.videos,
      totalAvaliacoes: p.totalAvaliacoes,
      mediaAvaliacoes: p.mediaAvaliacoes,
      publicado: p.publicado,
      opcoesTamanho: p.opcoesTamanho,
      opcoesCor: p.opcoesCor,
      highlights: p.highlights
    }));
    return res.json(mapped);
  } catch (error) {
    console.error("GET_PRODUCTS_ERROR", error);
    return res.status(500).json({ error: "Internal Error" });
  }
});

// Buscar produto por handle (APENAS SE PUBLICADO)
router.get("/handle/:handle", async (req, res) => {
  try {
    const p = await prisma.produto.findFirst({
      where: { 
        handle: req.params.handle,
        publicado: true
      },
    });
    if (!p) return res.status(404).json({ error: "Product not found" });

    return res.json({
      id: p.id,
      handle: p.handle,
      title: p.nome,
      description: p.descricao,
      price: p.preco,
      originalPrice: p.precoOriginal || 0,
      collection: p.collection,
      fotoPrincipal: p.fotoPrincipal || (p.fotos && p.fotos.length > 0 ? p.fotos[0] : null),
      images: p.fotos,
      videos: p.videos,
      totalAvaliacoes: p.totalAvaliacoes,
      mediaAvaliacoes: p.mediaAvaliacoes
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal Error" });
  }
});

// Buscar produtos por coleção
router.get("/collection/:collection", async (req, res) => {
  try {
    const products = await prisma.produto.findMany({
      where: {
        collection: {
          equals: req.params.collection,
          mode: "insensitive",
        },
      },
    });
    const mapped = products.map((p) => ({
      id: p.id,
      handle: p.handle,
      title: p.nome,
      description: p.descricao,
      price: p.preco,
      originalPrice: p.precoOriginal || 0,
      collection: p.collection,
      images: p.fotos,
    }));
    return res.json(mapped);
  } catch (error) {
    return res.status(500).json({ error: "Internal Error" });
  }
});



// Buscar por IDs (para o dashboard de customer)
router.post("/by-ids", async (req, res) => {
  try {
    const { ids } = req.body;
    const products = await prisma.produto.findMany({
      where: { id: { in: ids } },
      select: { id: true, nome: true, preco: true, fotos: true },
    });
    return res.json(products);
  } catch (error) {
    return res.status(500).json({ error: "Internal Error" });
  }
});

// ADMIN: Buscar produto por ID (Mesmo se não publicado)
router.get("/admin/:id", isAdmin, async (req, res) => {
  try {
    const p = await prisma.produto.findUnique({
      where: { id: req.params.id },
    });
    if (!p) return res.status(404).json({ error: "Product not found" });
    return res.json(p);
  } catch (error) {
    return res.status(500).json({ error: "Internal Error" });
  }
});

// ADMIN: Upsert produto
router.post("/upsert", isAdmin, async (req, res) => {
  try {
    const { id, nome, handle, ...productData } = req.body;
    const finalHandle = handle || slugify(nome);
    
    const data = {
      ...productData,
      nome,
      handle: finalHandle,
    };

    if (id) {
      await prisma.produto.update({ 
        where: { id }, 
        data
      });
    } else {
      await prisma.produto.create({ 
        data
      });
    }
    return res.json({ success: true, handle: finalHandle });
  } catch (error) {
    console.error("UPSERT_PRODUCT_ERROR", error);
    return res.status(500).json({ error: "Internal Error" });
  }
});

// ADMIN: Deletar produto
router.delete("/:id", isAdmin, async (req, res) => {
  try {
    await prisma.produto.delete({ where: { id: req.params.id } });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: "Internal Error" });
  }
});

export default router;
