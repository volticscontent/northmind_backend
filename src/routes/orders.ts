import { Router } from "express";
import prisma from "../lib/prisma";
import { isAdmin } from "../middleware/auth";

const router = Router();

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

// Listar pedidos abandonados (admin)
router.get("/abandoned", isAdmin, async (req, res) => {
  try {
    // Pedidos abandonados: status PENDENTE e criados há mais de 30 minutos
    const trintaMinutosAtras = new Date(Date.now() - 30 * 60 * 1000);

    const abandonedOrders = await prisma.pedido.findMany({
      where: {
        status: "PENDENTE",
        dataCompra: {
          lte: trintaMinutosAtras
        }
      },
      orderBy: { dataCompra: "desc" },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            telefone: true,
            id: true
          },
        },
      },
    });

    // Buscar detalhes dos produtos para cada pedido abandonado
    const productIds = Array.from(new Set(abandonedOrders.flatMap(o => o.produtosIds)));
    const products = await prisma.produto.findMany({
      where: { id: { in: productIds } },
      select: { id: true, nome: true, preco: true, fotos: true, handle: true },
    });

    const productsMap = products.reduce((acc: any, p) => ({ ...acc, [p.id]: p }), {});

    const enrichedOrders = abandonedOrders.map(order => ({
      ...order,
      produtos: order.produtosIds.map(id => productsMap[id]).filter(Boolean),
    }));

    return res.json(enrichedOrders);
  } catch (error) {
    console.error("GET_ABANDONED_ORDERS_ERROR", error);
    return res.status(500).json({ error: "Erro interno ao buscar pedidos abandonados." });
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
    console.error("ORDER_CREATION_ERROR_FULL:", {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack
    });
    return res.status(500).json({ 
      error: "Detailed Error", 
      message: error.message,
      code: error.code 
    });
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
