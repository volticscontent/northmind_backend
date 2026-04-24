import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Buscando Pedidos (criados no checkout) dos últimos 3 dias...");
  
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  threeDaysAgo.setHours(0, 0, 0, 0);

  const pedidos = await prisma.pedido.findMany({
    where: {
      dataCompra: {
        gte: threeDaysAgo,
      },
    },
    select: {
      id: true,
      status: true,
      dataCompra: true,
      totalAmmount: true
    }
  });

  const byDate = pedidos.reduce((acc, pedido) => {
    // Agrupa pela data no formato YYYY-MM-DD
    const dateStr = pedido.dataCompra.toISOString().split('T')[0];
    if (!acc[dateStr]) {
      acc[dateStr] = { quantidade: 0, valorTotalGBP: 0 };
    }
    acc[dateStr].quantidade += 1;
    acc[dateStr].valorTotalGBP += pedido.totalAmmount;
    return acc;
  }, {} as Record<string, { quantidade: number, valorTotalGBP: number }>);

  // Arredondar os valores
  for (const date in byDate) {
    byDate[date].valorTotalGBP = Number(byDate[date].valorTotalGBP.toFixed(2));
  }

  console.log("\n=== Resumo de Pedidos (Últimos 3 dias) ===");
  if (Object.keys(byDate).length === 0) {
    console.log("Nenhum pedido encontrado nesse período.");
  } else {
    console.table(byDate);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
