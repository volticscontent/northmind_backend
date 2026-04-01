import { Router } from "express";
import prisma from "../lib/prisma";

const router = Router();

// Buscar reviews de um produto
router.get("/product/:produtoId", async (req, res) => {
  try {
    const reviews = await prisma.comentario.findMany({
      where: { produtoId: req.params.produtoId },
      orderBy: { createdAt: "desc" },
    });
    return res.json(reviews);
  } catch (error) {
    return res.status(500).json({ error: "Internal Error" });
  }
});

// Verificar se o user pode fazer review
router.get("/can-review/:produtoId/:userEmail", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { email: req.params.userEmail },
      include: { pedidos: true },
    });
    if (!user) return res.json({ canReview: false });

    const hasPurchased = user.pedidos.some(
      (p) =>
        (p.status === "PAGO" || p.status === "ENTREGUE") &&
        p.produtosIds.includes(req.params.produtoId)
    );
    return res.json({ canReview: hasPurchased });
  } catch (error) {
    return res.status(500).json({ error: "Internal Error" });
  }
});

// Adicionar review
router.post("/", async (req, res) => {
  try {
    const { userEmail, produtoId, rating, texto, fotos, videoUrl } = req.body;
    const user = await prisma.user.findUnique({ where: { email: userEmail } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const review = await prisma.comentario.create({
      data: {
        userId: user.id,
        userName: user.name,
        produtoId,
        rating,
        texto,
        fotos: fotos || [],
        videoUrl: videoUrl || null,
      },
    });
    return res.json(review);
  } catch (error) {
    return res.status(500).json({ error: "Internal Error" });
  }
});

// Listar todas as reviews (Admin)
router.get("/all", async (req, res) => {
  try {
    const reviews = await prisma.comentario.findMany({
      orderBy: { createdAt: "desc" },
      include: { produto: { select: { nome: true } } }
    });
    return res.json(reviews);
  } catch (error) {
    return res.status(500).json({ error: "Internal Error" });
  }
});

// Atualizar review (Admin)
router.put("/:id", async (req, res) => {
  try {
    const { rating, texto, fotos, videoUrl } = req.body;
    const review = await prisma.comentario.update({
      where: { id: req.params.id },
      data: {
        rating,
        texto,
        fotos: fotos || [],
        videoUrl: videoUrl || null,
      },
    });
    return res.json(review);
  } catch (error) {
    return res.status(500).json({ error: "Internal Error" });
  }
});

// Deletar review (Admin)
router.delete("/:id", async (req, res) => {
  try {
    await prisma.comentario.delete({
      where: { id: req.params.id },
    });
    return res.status(200).json({ message: "Deleted" });
  } catch (error) {
    return res.status(500).json({ error: "Internal Error" });
  }
});

export default router;
