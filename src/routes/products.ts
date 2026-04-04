import { Router } from "express";
import prisma from "../lib/prisma";
import { isAdmin } from "../middleware/auth";

const router = Router();

// Helper para mapear produto do banco para o padrão de UX
// Centraliza toda a consistência de dados (avaliações, preços, mídias)
const mapProduct = (p: any) => ({
  id: p.id,
  handle: p.handle,
  title: p.nome,
  description: p.descricao,
  price: Number(p.preco) || 0,
  originalPrice: Number(p.precoOriginal) || 0,
  collection: p.collection,
  fotoPrincipal: p.fotoPrincipal || (p.fotos && p.fotos.length > 0 ? p.fotos[0] : null),
  images: p.fotos || [],
  videos: p.videos || [],
  totalAvaliacoes: Number(p.totalAvaliacoes) || 0,
  mediaAvaliacoes: Number(p.mediaAvaliacoes) || 5.0,
  opcoesTamanho: p.opcoesTamanho || [],
  opcoesCor: p.opcoesCor || [],
  highlights: p.highlights || [],
  materiais: p.materiais || [],
  guiaTamanho: p.guiaTamanho || null,
  detalhesModelo: p.detalhesModelo || null,
  instrucoesCuidado: p.instrucoesCuidado || null,
  especificacoes: p.especificacoes || [],
  variantes: p.variantes || [],
  tipo: p.tipo || "ROUPA"
});

// Buscar todos os produtos (público) - Usado pela vitrine geral
router.get("/", async (req, res) => {
  try {
    const products = await prisma.produto.findMany({
      orderBy: { createdAt: "desc" },
    });
    return res.json(products.map(mapProduct));
  } catch (error) {
    console.error("[BACKEND] GET / Error:", error);
    return res.status(500).json({ error: "Internal Error" });
  }
});

// Buscar produto por handle - Usado pela página de detalhes
router.get("/handle/:handle", async (req, res) => {
  try {
    const p = await prisma.produto.findFirst({
      where: {
        handle: req.params.handle,
      },
    });

    if (!p) return res.status(404).json({ error: "Product not found" });
    return res.json(mapProduct(p));
  } catch (error) {
    console.error("[BACKEND] GET /handle Error:", error);
    return res.status(500).json({ error: "Internal Error" });
  }
});

// Buscar produtos por coleção - Usado pelos carrosséis da Home e vitrines de categoria
router.get("/collection/:collection", async (req, res) => {
  try {
    const products = await prisma.produto.findMany({
      where: {
        collection: {
          equals: req.params.collection,
          mode: "insensitive",
        },
      },
      orderBy: { createdAt: "desc" },
    });
    console.log(`[BACKEND] Filtering products for collection: ${req.params.collection} (${products.length} found)`);
    return res.json(products.map(mapProduct));
  } catch (error) {
    console.error("[BACKEND] GET /collection Error:", error);
    return res.status(500).json({ error: "Internal Error" });
  }
});

// ADMIN: Listar produtos RAW (Sem mapeamento de UX)
router.get("/raw", isAdmin, async (req, res) => {
  try {
    const products = await prisma.produto.findMany({
      orderBy: { createdAt: "desc" },
    });
    return res.json(products);
  } catch (error) {
    return res.status(500).json({ error: "Internal Error" });
  }
});

// ADMIN: Upsert produto
router.post("/upsert", isAdmin, async (req, res) => {
  try {
    const { id, nome, handle, descricao, preco, precoOriginal, collection, fotoPrincipal, fotos, videos, opcoesTamanho, opcoesCor, variantes, tipo, highlights, materiais, guiaTamanho, detalhesModelo, instrucoesCuidado, especificacoes } = req.body;
    
    const data = {
      nome,
      handle: handle || nome?.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, ""),
      descricao,
      preco: Number(preco),
      precoOriginal: Number(precoOriginal),
      collection,
      fotoPrincipal,
      fotos,
      videos,
      opcoesTamanho,
      opcoesCor,
      variantes,
      highlights,
      materiais,
      guiaTamanho,
      detalhesModelo,
      instrucoesCuidado,
      especificacoes,
      tipo: tipo || "ROUPA"
    };

    if (!data.handle) {
      data.handle = handle;
    }

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
    return res.json({ success: true, handle: data.handle });
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
