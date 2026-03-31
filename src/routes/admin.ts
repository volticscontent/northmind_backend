import { Router } from "express";
import prisma from "../lib/prisma";
import { isAdmin, isSelfOrAdmin } from "../middleware/auth";

const router = Router();


// Admin Stats
router.get("/stats", isAdmin, async (req, res) => {
  try {
    const [totalOrders, totalRevenue, totalUsers, recentOrders] = await Promise.all([
      prisma.pedido.count(),
      prisma.pedido.aggregate({
        _sum: { totalAmmount: true },
        where: { status: { in: ["PAGO", "ENVIADO", "ENTREGUE"] } },
      }),
      prisma.user.count(),
      prisma.pedido.findMany({
        orderBy: { dataCompra: "desc" },
        take: 5,
        include: { user: { select: { name: true, email: true } } },
      }),
    ]);
    return res.json({
      totalOrders,
      totalRevenue: totalRevenue._sum.totalAmmount || 0,
      totalUsers,
      recentOrders,
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal Error" });
  }
});

// Customer dashboard data - Allow self or admin
router.get("/customer/:email", isSelfOrAdmin, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { email: req.params.email },
      include: {
        pedidos: { orderBy: { dataCompra: "desc" } },
      },
    });
    if (!user) return res.status(404).json({ error: "User not found" });

    const { hashedPassword: _, ...userSafe } = user;

    // Buscar produtos relacionados
    const uniqueProductIds = Array.from(new Set(user.pedidos.flatMap(p => p.produtosIds)));
    const products = await prisma.produto.findMany({
      where: { id: { in: uniqueProductIds } },
      select: { id: true, nome: true, preco: true, fotos: true, fotoPrincipal: true },
    });
    const productsDict = products.reduce((acc: any, p) => {
      acc[p.id] = {
        id: p.id,
        title: p.nome,
        price: p.preco,
        images: p.fotos,
        fotoPrincipal: p.fotoPrincipal || (p.fotos && p.fotos.length > 0 ? p.fotos[0] : null)
      };
      return acc;
    }, {});

    return res.json({ user: userSafe, productsDict });
  } catch (error) {
    console.error("GET_CUSTOMER_DASHBOARD_ERROR", error);
    return res.status(500).json({ error: "Internal Error" });
  }
});

// Checkout success verification
router.get("/verify-order/:orderId/:userId", async (req, res) => {
  try {
    const pedido = await prisma.pedido.findUnique({
      where: { id: req.params.orderId },
    });
    if (!pedido || pedido.userId !== req.params.userId) {
      return res.status(404).json({ error: "Invalid order" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.params.userId },
      select: { email: true, hashedPassword: true },
    });
    if (!user || !user.email) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ email: user.email, hasPassword: Boolean(user.hashedPassword) });
  } catch (error) {
    return res.status(500).json({ error: "Internal Error" });
  }
});

// Update user profile
router.put("/profile/:email", async (req, res) => {
  try {
    const { name, telefone, localizacao } = req.body;
    await prisma.user.update({
      where: { email: req.params.email },
      data: { name, telefone, localizacao },
    });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: "Internal Error" });
  }
});

// Admin: Make admin
router.post("/make-admin", isAdmin, async (req, res) => {
  try {
    const bcrypt = require("bcrypt");
    const email = "volticsbr@gmail.com";
    const hashedPassword = await bcrypt.hash("15951522", 12);

    const user = await prisma.admin.upsert({
      where: { email },
      update: { hashedPassword },
      create: {
        email,
        name: "Voltics Administrador",
        hashedPassword,
      },
    });

    return res.json({
      success: true,
      message: `O admin ${user.email} teve a senha redefinida.`,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
