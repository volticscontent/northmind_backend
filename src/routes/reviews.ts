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
    const { userEmail, produtoId, rating, texto } = req.body;
    const user = await prisma.user.findUnique({ where: { email: userEmail } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const review = await prisma.comentario.create({
      data: {
        userId: user.id,
        userName: user.name,
        produtoId,
        rating,
        texto,
      },
    });
    return res.json(review);
  } catch (error) {
    return res.status(500).json({ error: "Internal Error" });
  }
});

export default router;
