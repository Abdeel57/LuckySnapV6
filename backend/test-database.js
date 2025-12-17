// Script para probar la conexión a PostgreSQL
const { PrismaClient } = require('@prisma/client');

// Configurar URL de base de datos específica
const DATABASE_URL = 'postgresql://postgres:ZuCkGpLHcIJynmWvsMEqzIzypbuXotKm@nozomi.proxy.rlwy.net:50670/railway';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL
    }
  }
});

async function testConnection() {
    console.log('🔍 Probando conexión a PostgreSQL...');
    
    try {
        // Probar conexión básica
        await prisma.$connect();
        console.log('✅ Conexión a PostgreSQL exitosa');

        // Probar consulta simple
        const result = await prisma.$queryRaw`SELECT version()`;
        console.log('✅ Consulta de prueba exitosa:', result[0].version);

        // Verificar tablas
        const tables = await prisma.$queryRaw`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `;
        
        console.log('📋 Tablas en la base de datos:');
        tables.forEach(table => {
            console.log(`   - ${table.table_name}`);
        });

        // Contar registros en cada tabla
        const userCount = await prisma.user.count();
        const raffleCount = await prisma.raffle.count();
        const orderCount = await prisma.order.count();
        const winnerCount = await prisma.winner.count();

        console.log('📊 Registros actuales:');
        console.log(`   - Usuarios: ${userCount}`);
        console.log(`   - Rifas: ${raffleCount}`);
        console.log(`   - Órdenes: ${orderCount}`);
        console.log(`   - Ganadores: ${winnerCount}`);

        console.log('🎉 ¡Base de datos lista para usar!');

    } catch (error) {
        console.error('❌ Error de conexión:', error.message);
        console.error('💡 Verifica que:');
        console.error('   1. La URL de DATABASE_URL sea correcta');
        console.error('   2. La base de datos esté ejecutándose');
        console.error('   3. Las credenciales sean válidas');
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar prueba si se llama directamente
if (require.main === module) {
    testConnection()
        .then(() => {
            console.log('✅ Prueba completada');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Prueba falló:', error);
            process.exit(1);
        });
}

module.exports = { testConnection };
