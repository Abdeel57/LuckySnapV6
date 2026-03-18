import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  
  console.log('🚀 Iniciando migración de base de datos...');
  console.log('📡 Usando DATABASE_URL de entorno...');
  
  try {
    // 1. Añadir valor 'RELEASED' al enum OrderStatus si no existe
    // Nota: En PostgreSQL, los enums son tipos globales
    console.log('🔄 Actualizando enum OrderStatus...');
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'OrderStatus' AND e.enumlabel = 'RELEASED') THEN
              ALTER TYPE "OrderStatus" ADD VALUE 'RELEASED';
          END IF;
      EXCEPTION
          WHEN undefined_object THEN
              CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED', 'EXPIRED', 'RELEASED');
      END $$;
    `);
    console.log('✅ Enum OrderStatus actualizado');

    // 2. Añadir columna orderExpirationMinutes a settings
    console.log('🔄 Añadiendo columna orderExpirationMinutes a la tabla settings...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE settings 
      ADD COLUMN IF NOT EXISTS "orderExpirationMinutes" INTEGER DEFAULT 1440;
    `);
    console.log('✅ Tabla settings actualizada');

    console.log('🎉 Migración completada con éxito');
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
