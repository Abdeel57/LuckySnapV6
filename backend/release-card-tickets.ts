import { PrismaClient } from '@prisma/client';

const DATABASE_URL = "postgresql://postgres:soOPSwrlxnEjSmXKXzsFZJNrgfLQqzyC@centerbeam.proxy.rlwy.net:27393/railway?sslmode=no-verify";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL
    }
  }
});

async function recomputeAndPersistSold(raffleId: string) {
  const raffle = await prisma.raffle.findUnique({
    where: { id: raffleId },
    select: { id: true, tickets: true },
  });
  if (!raffle) return 0;

  const paidOrders = await prisma.order.findMany({
    where: { raffleId, status: 'PAID' as any },
    select: { tickets: true },
  });

  const sold = paidOrders.reduce((sum, order) => {
    const purchasedCount = Array.isArray(order.tickets)
      ? order.tickets.filter((t: any) => typeof t === 'number' && t >= 1 && t <= (raffle.tickets as any)).length
      : 0;
    return sum + purchasedCount;
  }, 0);

  await prisma.raffle.update({
    where: { id: raffleId },
    data: { sold },
  });

  return sold;
}

async function main() {
  console.log('🚀 Iniciando liberación de boletos apartados/pagados con tarjeta (PayPal)...');

  // 1. Encontrar todas las órdenes de PayPal
  const paypalOrders = await prisma.order.findMany({
    where: {
      paymentMethod: 'paypal',
      status: { in: ['PENDING', 'PAID'] } as any
    },
    select: {
      id: true,
      folio: true,
      raffleId: true,
      tickets: true,
      status: true
    }
  });

  if (paypalOrders.length === 0) {
    console.log('✅ No se encontraron órdenes de PayPal para liberar.');
    return;
  }

  console.log(`🔍 Se encontraron ${paypalOrders.length} órdenes para liberar.`);

  // 2. Liberar las órdenes (cambiar a CANCELLED)
  const affectedRaffleIds = new Set<string>();
  
  for (const order of paypalOrders) {
    console.log(`- Liberando orden ${order.folio} (Status anterior: ${order.status})...`);
    await prisma.order.update({
      where: { id: order.id },
      data: { 
        status: 'CANCELLED' as any,
        updatedAt: new Date()
      }
    });
    affectedRaffleIds.add(order.raffleId);
  }

  // 3. Recalcular sold para las rifas afectadas
  console.log('\n🔄 Recalculando boletos vendidos (sold) para las rifas afectadas...');
  for (const raffleId of affectedRaffleIds) {
    const newSold = await recomputeAndPersistSold(raffleId);
    console.log(`- Rifa ${raffleId}: Ahora tiene ${newSold} boletos vendidos.`);
  }

  console.log('\n✨ Proceso completado exitosamente. Todos los boletos de tarjeta han sido liberados.');
}

main()
  .catch(e => {
    console.error('❌ Error fatal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
