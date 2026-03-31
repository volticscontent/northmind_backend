import { Router } from "express";
import bcrypt from "bcrypt";
import prisma from "../lib/prisma";
import jwt from "jsonwebtoken";

const router = Router();

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "default_secret";

// Route used for bridging NextAuth credentials login from Frontend
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Missing info" });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user?.hashedPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isCorrectPassword = await bcrypt.compare(password, user.hashedPassword);
    if (!isCorrectPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const { hashedPassword, ...userWithoutPass } = user;
    const token = jwt.sign({ id: user.id, type: "USER" }, JWT_SECRET, { expiresIn: '7d' });

    return res.json({ user: { ...userWithoutPass, type: "USER" }, token });
  } catch (error) {
    console.error("LOGIN_ERROR", error);
    return res.status(500).json({ error: "Internal Error" });
  }
});

// Rota de login para Administradores
router.post("/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Missing info" });

    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin || !admin.hashedPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isCorrectPassword = await bcrypt.compare(password, admin.hashedPassword);
    if (!isCorrectPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const { hashedPassword, ...adminWithoutPass } = admin;
    const token = jwt.sign({ id: admin.id, type: "ADMIN" }, JWT_SECRET, { expiresIn: '7d' });

    return res.json({ user: { ...adminWithoutPass, type: "ADMIN" }, token });
  } catch (error) {
    console.error("ADMIN_LOGIN_ERROR", error);
    return res.status(500).json({ error: "Internal Error" });
  }
});

// Rota temporária para criar o primeiro administrador
router.post("/admin/create-first-admin", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Missing info" });
    }

    const adminCount = await prisma.admin.count();
    if (adminCount > 0) {
      return res.status(403).json({ error: "Cannot create more admins via this route." });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newAdmin = await prisma.admin.create({
      data: {
        email,
        name,
        hashedPassword,
      },
    });

    const { hashedPassword: _, ...adminWithoutPass } = newAdmin;
    return res.status(201).json(adminWithoutPass);
  } catch (error) {
    console.error("CREATE_FIRST_ADMIN_ERROR", error);
    return res.status(500).json({ error: "Internal Error" });
  }
});

router.post("/register", async (req, res) => {
  try {
    const { email, name, password, pais, aniversario, telefone } = req.body;

    if (!email || !name || !password) {
      return res.status(400).json({ error: "Missing info" });
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        hashedPassword,
        pais,
        aniversario: aniversario ? new Date(aniversario) : null,
        telefone,
      },
    });

    const { hashedPassword: _, ...userSemSenha } = user;
    return res.status(201).json(userSemSenha);
  } catch (error: any) {
    console.error("REGISTRATION_ERROR", error);
    return res.status(500).json({ error: "Internal Error" });
  }
});

router.get("/user/:email", async (req, res) => {
  try {
    const email = req.params.email;
    const user = await prisma.user.findUnique({
      where: { email }
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    
    const { hashedPassword: _, ...userSemSenha } = user;
    return res.json(userSemSenha);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Error" });
  }
});
router.post("/set-password", async (req, res) => {
  try {
    const { userId, orderId, password } = req.body;

    if (!userId || !password) {
      return res.status(400).json({ error: "Missing userId or password" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Se já tem senha, não permitir sobrescrever por esta rota
    if (user.hashedPassword) {
      return res.status(400).json({ error: "User already has a password" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { hashedPassword },
    });

    return res.json({ success: true });
  } catch (error) {
    console.error("SET_PASSWORD_ERROR", error);
    return res.status(500).json({ error: "Internal Error" });
  }
});

export default router;
