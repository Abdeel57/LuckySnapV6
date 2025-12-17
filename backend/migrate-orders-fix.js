const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateOrdersFix() {
  try {
    console.log('🔄 Iniciando migración de órdenes...');

    // Verificar si existe la columna 'total' en la tabla orders
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'total'
    `;

    if (tableInfo.length === 0) {
      console.log('📝 Agregando columna "total" a la tabla orders...');
      await prisma.$executeRaw`
        ALTER TABLE "orders" ADD COLUMN "total" DOUBLE PRECISION;
      `;
      console.log('✅ Columna "total" agregada exitosamente');
    } else {
      console.log('ℹ️ La columna "total" ya existe');
    }

    // Actualizar todas las órdenes para que tengan el campo total
    console.log('🔄 Actualizando órdenes existentes...');
    const updateResult = await prisma.$executeRaw`
      UPDATE "orders" 
      SET "total" = "totalAmount" 
      WHERE "total" IS NULL
    `;
    console.log(`✅ ${updateResult} órdenes actualizadas`);

    // Verificar el estado de las órdenes
    const ordersCount = await prisma.order.count();
    console.log(`📊 Total de órdenes en la base de datos: ${ordersCount}`);

    // Mostrar estadísticas por estado
    const stats = await prisma.order.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
    });

    console.log('📈 Estadísticas por estado:');
    stats.forEach(stat => {
      console.log(`  - ${stat.status}: ${stat._count.status} órdenes`);
    });

    console.log('✅ Migración completada exitosamente');
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la migración
migrateOrdersFix()
  .then(() => {
    console.log('🎉 Migración finalizada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
