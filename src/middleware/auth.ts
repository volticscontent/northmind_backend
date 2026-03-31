import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "default_secret"; // Usar a mesma chave secreta do auth.ts

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  console.log("Middleware isAdmin: Verificando requisição...");
  const authHeader = req.headers.authorization;
  console.log("Authorization Header:", authHeader);

  if (!authHeader) {
    console.log("Middleware isAdmin: Falha - Cabeçalho de autorização ausente.");
    return res.status(401).json({ error: "Authorization header missing" });
  }

  const token = authHeader.split(' ')[1]; // Espera-se "Bearer TOKEN"
  console.log("Token extraído:", token);

  if (!token) {
    console.log("Middleware isAdmin: Falha - Token ausente.");
    return res.status(401).json({ error: "Token missing" });
  }

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);

    // Assumindo que o token JWT contém o tipo de usuário
    if (decoded.type !== "ADMIN") {
      console.log(`Middleware isAdmin: Falha - Tipo de usuário não é ADMIN.`);
      return res.status(403).json({ error: "Forbidden: Admin Only" });
    }

    console.log("Middleware isAdmin: Sucesso - Usuário é ADMIN.");
    (req as any).userId = decoded.id; // Adiciona o ID do usuário à requisição
    next();
  } catch (error) {
    console.error("Middleware isAdmin: Falha - Token inválido ou expirado.", error);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

export const isSelfOrAdmin = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token" });

  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const requestedEmail = req.params.email;

    if (decoded.email === requestedEmail || decoded.type === "ADMIN") {
      (req as any).user = decoded;
      return next();
    }

    return res.status(403).json({ error: "Forbidden: Not authorized" });
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
