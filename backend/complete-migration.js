// Script para completar la migración con usuarios y órdenes
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

async function completeMigration() {
    console.log('🚀 Completando migración...');
    
    try {
        // 1. Crear usuarios adicionales
        console.log('👥 Creando usuarios...');
        
        const user1 = await prisma.user.upsert({
            where: { email: 'juan@email.com' },
            update: { name: 'Juan Pérez' },
            create: {
                email: 'juan@email.com',
                name: 'Juan Pérez'
            }
        });
        console.log('✅ Usuario Juan creado');

        const user2 = await prisma.user.upsert({
            where: { email: 'maria@email.com' },
            update: { name: 'María García' },
            create: {
                email: 'maria@email.com',
                name: 'María García'
            }
        });
        console.log('✅ Usuario María creado');

        const user3 = await prisma.user.upsert({
            where: { email: 'carlos@email.com' },
            update: { name: 'Carlos López' },
            create: {
                email: 'carlos@email.com',
                name: 'Carlos López'
            }
        });
        console.log('✅ Usuario Carlos creado');

        // 2. Crear órdenes
        console.log('📦 Creando órdenes...');
        
        await prisma.order.createMany({
            data: [
                {
                    folio: 'ORD-1704067200001',
                    raffleId: '1',
                    userId: user1.id,
                    tickets: [5, 10, 15],
                    total: 150,
                    status: 'PENDING',
                    expiresAt: new Date('2024-01-02T10:00:00.000Z')
                },
                {
                    folio: 'ORD-1704067200002',
                    raffleId: '1',
                    userId: user2.id,
                    tickets: [25, 30],
                    total: 100,
                    status: 'PAID',
                    expiresAt: new Date('2024-01-02T11:00:00.000Z')
                },
                {
                    folio: 'ORD-1704067200003',
                    raffleId: '1',
                    userId: user3.id,
                    tickets: [1, 2, 3],
                    total: 150,
                    status: 'PENDING',
                    expiresAt: new Date('2024-01-02T12:00:00.000Z')
                }
            ]
        });
        console.log('✅ Órdenes creadas');

        // 3. Crear otra rifa
        console.log('🎫 Creando segunda rifa...');
        await prisma.raffle.create({
            data: {
                id: '2',
                title: 'PlayStation 5',
                description: 'La consola de videojuegos más avanzada',
                imageUrl: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=400&h=300&fit=crop',
                price: 100,
                totalTickets: 50,
                sold: 15,
                endDate: new Date('2024-11-30T23:59:59.000Z'),
                isActive: true,
                status: 'active',
                slug: 'playstation-5'
            }
        });
        console.log('✅ Segunda rifa creada');

        // 4. Crear ganador
        console.log('🏆 Creando ganador...');
        await prisma.winner.create({
            data: {
                raffleId: '1',
                userId: user1.id,
                ticketId: 'ticket-1'
            }
        });
        console.log('✅ Ganador creado');

        console.log('🎉 ¡Migración completada exitosamente!');
        
        // Mostrar resumen final
        const userCount = await prisma.user.count();
        const raffleCount = await prisma.raffle.count();
        const orderCount = await prisma.order.count();
        const winnerCount = await prisma.winner.count();
        
        console.log(`📊 Resumen final:`);
        console.log(`   - Usuarios: ${userCount}`);
        console.log(`   - Rifas: ${raffleCount}`);
        console.log(`   - Órdenes: ${orderCount}`);
        console.log(`   - Ganadores: ${winnerCount}`);

    } catch (error) {
        console.error('❌ Error durante la migración:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar migración si se llama directamente
if (require.main === module) {
    completeMigration()
        .then(() => {
            console.log('✅ Migración completada');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Error en migración:', error);
            process.exit(1);
        });
}

module.exports = { completeMigration };

