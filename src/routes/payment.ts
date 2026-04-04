import { Router } from "express";
import Stripe from "stripe";
import { sendToUtmfy } from "../lib/utmfy";

const router = Router();
const stripeSecretKey = process.env.STRIPE_SECRET_KEY as string;

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2023-10-16" as any, 
});

const GBP_TO_BRL = 7.4; // Taxa de conversão aproximada para UTMify dashboard

// --- Rota de Início de Checkout (IC) S2S ---
router.post("/track-ic", async (req, res) => {
  try {
    const { customer, trackingParameters, amount, products } = req.body;
    
    console.log(`[UTMify] 🛒 IC Event: ${customer.email}`);

    const now = new Date().toISOString();
    // Converter de Libras para Reais para que o painel da UTMify fique correto
    const totalInCents = Math.round(amount * 100 * GBP_TO_BRL); 

    const data = {
      orderId: 'ic_' + Date.now(),
      platform: 'stripe',
      paymentMethod: 'credit_card',
      status: 'waiting_payment', // Corrigido: deve ser um dos valores aceitos
      createdAt: now,
      approvedDate: now, // Enviando mesmo que pendente para evitar erro de schema
      customer: {
        ...customer,
        document: null // Obrigatório
      },
      trackingParameters: {
        ...trackingParameters,
        utm_content: trackingParameters.utm_content || null,
        utm_term: trackingParameters.utm_term || null,
      },
      commission: {
        totalPriceInCents: totalInCents,
        gatewayFeeInCents: Math.round(totalInCents * 0.04), 
        userCommissionInCents: totalInCents - Math.round(totalInCents * 0.04),
      },
      products: products ? products.map((p: any) => ({
        id: p.id || 'p1',
        name: p.name || 'Product',
        planId: p.id || 'p1',
        planName: p.name || 'Product',
        quantity: p.quantity || 1,
        priceInCents: p.priceInCents || totalInCents
      })) : [{
        id: 'checkout_start',
        name: 'Checkout Initiation',
        planId: 'checkout_start',
        planName: 'Checkout Initiation',
        quantity: 1,
        priceInCents: totalInCents
      }]
    };

    const success = await sendToUtmfy(data);
    return res.json({ success });
  } catch (error) {
    console.error("[UTMify] Error tracking IC:", error);
    return res.status(500).json({ error: "Internal Error" });
  }
});

// --- Rota de Compra Final (Purchase) S2S ---
router.post("/track-purchase", async (req, res) => {
  try {
    const { intentId, utmifyIdManual } = req.body;
    if (!intentId) return res.status(400).json({ error: "intentId required" });

    console.log(`[UTMify] 💰 Purchase Event: ${intentId}`);

    // Busca metadados do Stripe para garantir correspondência máxima
    const paymentIntent = await stripe.paymentIntents.retrieve(intentId, {
       expand: ['customer', 'payment_method'],
    });

    if (paymentIntent.status !== 'succeeded') {
       console.warn(`[UTMify] PaymentIntent ${intentId} is not finished yet.`);
       return res.status(400).json({ error: "Payment not succeeded" });
    }

    const metadata = paymentIntent.metadata || {};
    const now = new Date().toISOString();

    const totalPriceInBRL = Math.round(paymentIntent.amount * GBP_TO_BRL);
    
    console.log(`[UTMify] 💱 Converting GBP to BRL:`);
    console.log(`       - Original: £${(paymentIntent.amount / 100).toFixed(2)}`);
    console.log(`       - Converted: R$ ${(totalPriceInBRL / 100).toFixed(2)} (x${GBP_TO_BRL})`);

    const data = {
      orderId: paymentIntent.id,
      platform: 'stripe',
      paymentMethod: 'credit_card',
      status: 'paid',
      createdAt: now,
      approvedDate: now,
      customer: {
        name: (metadata.customer_name as string) || 'Customer',
        email: (paymentIntent.receipt_email as string) || (metadata.customer_email as string) || 'cliente@email.com',
        phone: (metadata.customer_phone as string) || null,
        document: null // Obrigatório
      },
      trackingParameters: {
        utmify_id: utmifyIdManual || (metadata.utmify_id as string) || null,
        utm_source: (metadata.utm_source as string) || null,
        utm_medium: (metadata.utm_medium as string) || null,
        utm_campaign: (metadata.utm_campaign as string) || null,
        utm_content: (metadata.utm_content as string) || null,
        utm_term: (metadata.utm_term as string) || null,
      },
      commission: {
        totalPriceInCents: totalPriceInBRL,
        gatewayFeeInCents: Math.round(totalPriceInBRL * 0.04), 
        userCommissionInCents: Math.round(totalPriceInBRL * 0.96),
      },
      products: [
        {
          id: 'order_' + paymentIntent.id,
          name: (metadata.product_name as string) || 'North Mind Order',
          planId: 'order_' + paymentIntent.id,
          planName: (metadata.product_name as string) || 'North Mind Order',
          quantity: 1,
          priceInCents: totalPriceInBRL,
        }
      ],
    };

    const success = await sendToUtmfy(data);
    return res.json({ 
      success, 
      orderId: paymentIntent.id, 
      amountInBRL: totalPriceInBRL / 100,
      amountInGBP: paymentIntent.amount / 100
    });
  } catch (error) {
    console.error("[UTMify] Error tracking Purchase:", error);
    return res.status(500).json({ error: "Internal Error" });
  }
});

router.post("/create-payment-intent", async (req, res) => {
// ... rest of file (keeps existing routes below)
  try {
    const { amount, currency, metadata } = req.body;

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
        ...metadata,
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

// Rota para atualizar metadados de um Payment Intent já existente
router.post("/update-metadata", async (req, res) => {
  try {
    const { intentId, metadata } = req.body;
    if (!intentId) return res.status(400).json({ error: "intentId obrigatório" });

    await stripe.paymentIntents.update(intentId, {
      metadata: {
        ...metadata,
        source: 'checkout_update'
      }
    });

    return res.json({ success: true });
  } catch (error: any) {
    console.error("Erro ao atualizar metadados:", error);
    return res.status(500).json({ error: "Erro ao atualizar informações de rastreamento." });
  }
});

export default router;
