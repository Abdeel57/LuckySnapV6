const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  const prisma = new PrismaClient();
  
  try {
    // Probar conexión básica
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Conexión exitosa:', result);
    
    // Probar si las tablas existen
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log('📋 Tablas encontradas:', tables);
    
  } catch (error) {
    console.log('❌ Error de conexión:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
