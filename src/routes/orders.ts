import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { isAdmin } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });

// Listar todos os pedidos (admin)
router.get("/", isAdmin, async (req, res) => {
  try {
    const orders = await prisma.pedido.findMany({
      orderBy: { dataCompra: "desc" },
      include: { user: { select: { name: true, email: true, id: true } } },
    });
    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ error: "Internal Error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { items, total, status = "PENDENTE", customerInfo, userEmail } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "No items in order" });
    }

    let userId = "";

    // Autenticação via corpo da requisição enviada do Frontend
    if (userEmail) {
      const user = await prisma.user.findUnique({
        where: { email: userEmail }
      });
      if (user) userId = user.id;
    }

    // Se não encontrou o usuário pelo email logado, criamos upsert pelo customerInfo do checkout
    if (!userId && customerInfo?.email) {
      const user = await prisma.user.upsert({
        where: { email: customerInfo.email },
        update: {
          name: `${customerInfo.firstName} ${customerInfo.lastName}`,
          telefone: customerInfo.phone,
        },
        create: {
          email: customerInfo.email,
          name: `${customerInfo.firstName} ${customerInfo.lastName}`,
          telefone: customerInfo.phone
        }
      });
      userId = user.id;
    }

    if (!userId) {
      return res.status(401).json({ error: "User identification failed" });
    }

    const pedido = await prisma.pedido.create({
      data: {
        userId: userId,
        status: status,
        produtosIds: items.map((item: any) => item.id),
        totalAmmount: total,
      },
    });

    return res.json({ id: pedido.id, userId: userId });
  } catch (error: any) {
    console.error("ORDER_CREATION_ERROR", error);
    return res.status(500).json({ error: "Internal Error" });
  }
});

router.put("/:orderId/status", isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const { orderId } = req.params;
    
    // Atualiza status do pedido
    const updated = await prisma.pedido.update({
      where: { id: orderId },
      data: { status }
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: "Error updating order" });
  }
})

export default router;
