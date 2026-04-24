import Stripe from 'stripe';
import * as dotenv from 'dotenv';
import path from 'path';

// Carrega as variáveis de ambiente
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const stripeSecret = process.env.STRIPE_SECRET_KEY;

if (!stripeSecret) {
  console.error("Erro: STRIPE_SECRET_KEY não encontrada no arquivo .env");
  process.exit(1);
}

const stripe = new Stripe(stripeSecret, {
  apiVersion: '2023-10-16',
});

async function fetchICs() {
  console.log("Buscando Initiate Checkouts (Payment Intents) dos últimos 3 dias no Stripe...");
  
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  threeDaysAgo.setHours(0, 0, 0, 0);
  const unixThreeDaysAgo = Math.floor(threeDaysAgo.getTime() / 1000);

  let hasMore = true;
  let startingAfter: string | undefined = undefined;
  
  const icByDate: Record<string, { quantidade: number, valorTotalGBP: number }> = {};

  while (hasMore) {
    const response: Stripe.Response<Stripe.ApiList<Stripe.PaymentIntent>> = await stripe.paymentIntents.list({
      created: { gte: unixThreeDaysAgo },
      limit: 100,
      starting_after: startingAfter,
    });

    for (const pi of response.data) {
      // Ajuste de timezone se necessário (usando UTC/ISO por padrão)
      const date = new Date(pi.created * 1000).toISOString().split('T')[0];
      
      if (!icByDate[date]) {
        icByDate[date] = { quantidade: 0, valorTotalGBP: 0 };
      }
      
      icByDate[date].quantidade += 1;
      icByDate[date].valorTotalGBP += (pi.amount / 100); // Stripe amount é em centavos
    }

    if (response.has_more) {
      startingAfter = response.data[response.data.length - 1].id;
    } else {
      hasMore = false;
    }
  }

  // Arredondar os valores totais para 2 casas decimais
  for (const date in icByDate) {
    icByDate[date].valorTotalGBP = Number(icByDate[date].valorTotalGBP.toFixed(2));
  }

  console.log("\n=== Resumo de ICs (Últimos 3 dias) ===");
  if (Object.keys(icByDate).length === 0) {
    console.log("Nenhum IC encontrado nesse período.");
  } else {
    console.table(icByDate);
  }
}

fetchICs().catch(console.error);
