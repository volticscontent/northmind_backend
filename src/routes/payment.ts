import { Router } from "express";
import Stripe from "stripe";

const router = Router();
const stripeSecretKey = process.env.STRIPE_SECRET_KEY as string;

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2023-10-16" as any, 
});

router.post("/create-payment-intent", async (req, res) => {
  try {
    const { amount, currency } = req.body;

    if (!amount || !currency) {
      return res.status(400).json({ error: "Amount e currency são obrigatórios." });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), 
      currency: currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        source: 'api_direct'
      }
    });

    return res.json({
      clientSecret: paymentIntent.client_secret,
      intentId: paymentIntent.id
    });
  } catch (error: any) {
    console.error("Erro interno ao criar Payment Intent:", error);
    return res.status(500).json({ error: error.message || "Ocorreu um erro interno ao processar o pagamento." });
  }
});

// Rota de verificação via API (sem webhook)
router.get("/verify/:intentId", async (req, res) => {
  try {
    const { intentId } = req.params;
    if (!intentId) return res.status(400).json({ error: "intentId obrigatório" });

    const paymentIntent = await stripe.paymentIntents.retrieve(intentId);

    // Aqui podemos atualizar o banco de dados baseando-se no status
    // Ex: se paymentIntent.status === 'succeeded' atualizar a order

    return res.json({ status: paymentIntent.status, paymentIntent });
  } catch (error: any) {
    console.error("Erro na verificação de pagamento:", error);
    return res.status(500).json({ error: "Erro interno verificando pagamento." });
  }
});

export default router;
