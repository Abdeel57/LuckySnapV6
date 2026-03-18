import { PrismaClient } from '@prisma/client';

/**
 * ESTE SCRIPT LIBERA TODAS LAS ÓRDENES DE TARJETA (PAYPAL)
 * 1. Busca órdenes con paymentMethod = 'paypal' y status PENDING o PAID.
 * 2. Cambia su status a 'CANCELLED'.
 * 3. Actualiza el conteo de boletos vendidos (sold) en las rifas afectadas.
 */

// NOTA: Asegúrate de tener la DATABASE_URL correcta en tu archivo .env
const prisma = new PrismaClient();

async function recomputeSold(raffleId: string) {
  const raffle = await prisma.raffle.findUnique({
    where: { id: raffleId },
    select: { id: true, tickets: true },
  });
  if (!raffle) return;

  const paidOrders = await prisma.order.findMany({
    where: { raffleId, status: 'PAID' as any },
    select: { tickets: true },
  });

  const sold = paidOrders.reduce((sum, order) => {
    const purchased = Array.isArray(order.tickets) 
      ? order.tickets.filter((t: any) => typeof t === 'number' && t >= 1 && t <= (raffle.tickets as any)).length 
      : 0;
    return sum + purchased;
  }, 0);

  await prisma.raffle.update({
    where: { id: raffleId },
    data: { sold },
  });
  console.log(`✅ Rifa ${raffleId} actualizada: ${sold} boletos vendidos.`);
}

async function start() {
  console.log('🚀 Iniciando liberación de boletos de tarjeta (PayPal)...');
  
  try {
    const orders = await prisma.order.findMany({
      where: {
        paymentMethod: 'paypal',
        status: { in: ['PENDING', 'PAID'] } as any
      }
    });

    if (orders.length === 0) {
      console.log('ℹ️ No se encontraron órdenes de PayPal para liberar.');
      return;
    }

    console.log(`🔍 Liberando ${orders.length} órdenes...`);

    const affectedRaffles = new Set<string>();

    for (const order of orders) {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'CANCELLED' as any }
      });
      console.log(`- Orden ${order.folio} liberada.`);
      affectedRaffles.add(order.raffleId);
    }

    console.log('\n🔄 Actualizando estadísticas de las rifas...');
    for (const raffleId of affectedRaffles) {
      await recomputeSold(raffleId);
    }

    console.log('\n✨ ¡Proceso terminado! Todos los boletos de tarjeta están disponibles de nuevo.');
  } catch (error) {
    console.error('❌ Error durante el proceso:', error);
    console.log('\n💡 Tip: Verifica que tu DATABASE_URL en el archivo .env sea correcta y que la base de datos esté activa.');
  } finally {
    await prisma.$disconnect();
  }
}

start();
