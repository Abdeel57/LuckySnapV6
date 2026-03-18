import { PrismaClient } from '@prisma/client';

const URLS = [
  "postgresql://postgres:ZuCkGpLHcIJynmWvsMEqzIzypbuXotKm@nozomi.proxy.rlwy.net:50670/railway",
  "postgresql://postgres:soOPSwrlxnEjSmXKXzsFZJNrgfLQqzyC@centerbeam.proxy.rlwy.net:27393/railway",
  "postgresql://postgres:password@localhost:5432/lucky_snap",
  "postgresql://postgres:postgres@localhost:5432/lucky_snap",
  "postgresql://postgres:password@localhost:5432/railway",
  "postgresql://postgres:postgres@localhost:5432/railway"
];

async function tryConnect(url: string) {
  const prisma = new PrismaClient({
    datasources: { db: { url } }
  });
  try {
    await prisma.$connect();
    console.log(`✅ Conexión EXITOSA con: ${url}`);
    return prisma;
  } catch (e: any) {
    console.log(`❌ Conexión fallida con ${url}: ${e.message.split('\n')[0]}`);
    await prisma.$disconnect();
    return null;
  }
}

async function recomputeAndPersistSold(prisma: PrismaClient, raffleId: string) {
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
  let prisma: PrismaClient | null = null;
  for (const url of URLS) {
    prisma = await tryConnect(url);
    if (prisma) break;
  }

  if (!prisma) {
    console.error('\n❌ No se pudo conectar a ninguna base de datos conocida.');
    process.exit(1);
  }

  console.log('\n🚀 Iniciando liberación de boletos PayPal...');
  const paypalOrders = await prisma.order.findMany({
    where: {
      paymentMethod: 'paypal',
      status: { in: ['PENDING', 'PAID'] } as any
    }
  });

  if (paypalOrders.length === 0) {
    console.log('✅ No se encontraron órdenes de PayPal.');
  } else {
    for (const order of paypalOrders) {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'CANCELLED' as any }
      });
      console.log(`- Liberada orden ${order.folio}`);
    }
    
    const affectedRaffles = [...new Set(paypalOrders.map(o => o.raffleId))];
    for (const rid of affectedRaffles) {
      await recomputeAndPersistSold(prisma, rid);
    }
    console.log('✨ Liberación completada.');
  }
}

main().catch(console.error);
