import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import cors from 'cors';
import prisma from './lib/prisma';

const app = express();

import paymentRoutes from './routes/payment';
import orderRoutes from './routes/orders';
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import reviewRoutes from './routes/reviews';
import adminRoutes from './routes/admin';
import collectionRoutes from './routes/collections';
import uploadRoutes from './routes/upload';

app.use(cors());
app.use(express.json()); 

app.use('/api/payment', paymentRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/upload', uploadRoutes);

app.get('/health', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected', error });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`--------------------------------------------------`);
  console.log(`[BACKEND] North Mind Server Started!`);
  console.log(`[BACKEND] Port: ${PORT}`);
  console.log(`[BACKEND] Database: ${process.env.DATABASE_URL ? "CONNECTED" : "MISSING DATABASE_URL"}`);
  console.log(`--------------------------------------------------`);
});
