import { PrismaClient } from '@prisma/client';

const DATABASE_URL = "postgresql://postgres:soOPSwrlxnEjSmXKXzsFZJNrgfLQqzyC@centerbeam.proxy.rlwy.net:27393/railway";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL
    }
  }
});

async function main() {
  const activeRaffle = await prisma.raffle.findFirst({
    where: { status: 'active' }
  });

  if (!activeRaffle) {
    console.log("No hay ninguna rifa activa con status 'active'.");
    // Intentar buscar todas las rifas para ver qué status tienen
    const allRaffles = await prisma.raffle.findMany({ select: { title: true, status: true } });
    if (allRaffles.length > 0) {
      console.log("Rifas encontradas:", JSON.stringify(allRaffles, null, 2));
    } else {
      console.log("No se encontraron rifas en la base de datos.");
    }
    return;
  }

  console.log(`Rifa activa detectada: ${activeRaffle.title} (ID: ${activeRaffle.id})`);

  const cardOrders = await prisma.order.findMany({
    where: {
      raffleId: activeRaffle.id,
      status: 'PAID',
      paymentMethod: 'paypal'
    },
    include: {
      user: true
    }
  });

  if (cardOrders.length === 0) {
    console.log("No hay boletos pagados con tarjeta (PayPal) en esta rifa.");
    return;
  }

  console.log(`\n===== DETALLE DE PAGOS CON TARJETA (Rifa: ${activeRaffle.title}) =====`);
  let allTickets: number[] = [];
  
  cardOrders.forEach(order => {
    console.log(`- Folio: ${order.folio}`);
    console.log(`  Cliente: ${order.user?.name || 'N/A'}`);
    console.log(`  Teléfono: ${order.user?.phone || 'N/A'}`);
    console.log(`  Boletos: ${order.tickets.join(', ')}`);
    console.log(`  Total: L. ${order.total.toFixed(2)}`);
    console.log('--------------------------------------------------');
    allTickets = [...allTickets, ...order.tickets];
  });

  // Sort and remove duplicates (though there shouldn't be duplicates)
  const uniqueTickets = [...new Set(allTickets)].sort((a, b) => a - b);

  console.log(`\nResumen total:`);
  console.log(`- Total de órdenes pagadas con tarjeta: ${cardOrders.length}`);
  console.log(`- Total de boletos pagados con tarjeta: ${allTickets.length}`);
  console.log(`- Lista completa de boletos: ${uniqueTickets.join(', ')}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
