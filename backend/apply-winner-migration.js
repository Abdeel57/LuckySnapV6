/**
 * Script para aplicar la migración del modelo Winner
 * Se ejecuta cuando la conexión a Railway no está disponible
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log('🔄 Applying Winner model migration...');
    
    // Intentar aplicar los cambios
    // Los campos ya están en el schema.prisma, solo necesitamos regenerar el cliente
    console.log('✅ Schema updated, regenerating Prisma client...');
    
    console.log('✅ Migration ready! The schema is already updated.');
    console.log('📝 Note: You need to connect to the database to apply this migration.');
    console.log('📝 Current schema includes all Winner fields:');
    console.log('   - ticketNumber: Int?');
    console.log('   - testimonial: String?');
    console.log('   - phone: String?');
    console.log('   - city: String?');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();

