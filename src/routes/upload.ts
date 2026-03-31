import { Router } from "express";
import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import multer from "multer";
import { isAdmin } from "../middleware/auth";
import crypto from "crypto";
import path from "path";

const router = Router();

// Configuração do Multer (armazenamento em memória)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|mov|webm|avif/;
    const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mime = allowedTypes.test(file.mimetype.split("/")[1]);
    if (ext || mime) return cb(null, true);
    cb(new Error("Apenas imagens e vídeos são permitidos."));
  },
});

// Cliente S3 para Cloudflare R2
const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME || "northmind";
const PUBLIC_URL = process.env.R2_PUBLIC_URL || "";

// Upload de arquivo(s) — aceita até 10 arquivos por vez
router.post("/", isAdmin, upload.array("files", 10), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "Nenhum arquivo enviado." });
    }

    const folder = (req.body.folder || "products").replace(/[^a-z0-9-_]/gi, "");
    const urls: string[] = [];

    for (const file of files) {
      const ext = path.extname(file.originalname).toLowerCase();
      const key = `${folder}/${crypto.randomUUID()}${ext}`;

      await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }));

      urls.push(`${PUBLIC_URL}/${key}`);
    }

    return res.json({ urls });
  } catch (error) {
    console.error("UPLOAD_ERROR", error);
    return res.status(500).json({ error: "Falha no upload." });
  }
});

// Deletar um objeto do R2
router.delete("/", isAdmin, async (req, res) => {
  try {
    const { key } = req.body;
    if (!key) return res.status(400).json({ error: "Key é obrigatória." });

    // Extrair a key da URL completa se necessário
    const objectKey = key.startsWith("http") ? new URL(key).pathname.slice(1) : key;

    await s3.send(new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: objectKey,
    }));

    return res.json({ success: true });
  } catch (error) {
    console.error("DELETE_OBJECT_ERROR", error);
    return res.status(500).json({ error: "Falha ao deletar." });
  }
});

// Listar objetos em uma pasta
router.get("/list", isAdmin, async (req, res) => {
  try {
    const prefix = (req.query.folder as string) || "products/";
    const result = await s3.send(new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: prefix,
      MaxKeys: 100,
    }));

    const objects = (result.Contents || []).map(obj => ({
      key: obj.Key,
      url: `${PUBLIC_URL}/${obj.Key}`,
      size: obj.Size,
      lastModified: obj.LastModified,
    }));

    return res.json({ objects });
  } catch (error) {
    console.error("LIST_OBJECTS_ERROR", error);
    return res.status(500).json({ error: "Falha ao listar." });
  }
});

export default router;
