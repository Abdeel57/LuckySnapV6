// Script simple para migrar datos básicos
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

async function simpleMigrate() {
    console.log('🚀 Iniciando migración simple...');
    
    try {
        // 1. Crear configuración básica
        console.log('📝 Creando configuración...');
        await prisma.settings.upsert({
            where: { id: 'main_settings' },
            update: {
                siteName: 'Lucky Snap',
                paymentAccounts: [
                    {
                        id: '1',
                        bank: 'Banco Principal',
                        accountNumber: '1234567890',
                        accountHolder: 'Lucky Snap',
                        clabe: '123456789012345678'
                    }
                ],
                faqs: [
                    {
                        id: '1',
                        question: '¿Cómo funcionan las rifas?',
                        answer: 'Las rifas funcionan comprando boletos y participando en sorteos.'
                    }
                ]
            },
            create: {
                id: 'main_settings',
                siteName: 'Lucky Snap',
                paymentAccounts: [
                    {
                        id: '1',
                        bank: 'Banco Principal',
                        accountNumber: '1234567890',
                        accountHolder: 'Lucky Snap',
                        clabe: '123456789012345678'
                    }
                ],
                faqs: [
                    {
                        id: '1',
                        question: '¿Cómo funcionan las rifas?',
                        answer: 'Las rifas funcionan comprando boletos y participando en sorteos.'
                    }
                ]
            }
        });
        console.log('✅ Configuración creada');

        // 2. Crear usuario admin
        console.log('👤 Creando usuario admin...');
        await prisma.adminUser.upsert({
            where: { email: 'admin@luckysnap.com' },
            update: {
                name: 'Administrador',
                password: 'admin123'
            },
            create: {
                email: 'admin@luckysnap.com',
                name: 'Administrador',
                password: 'admin123'
            }
        });
        console.log('✅ Usuario admin creado');

        // 3. Crear rifa de ejemplo
        console.log('🎫 Creando rifa de ejemplo...');
        await prisma.raffle.create({
            data: {
                id: '1',
                title: 'iPhone 15 Pro Max',
                description: 'El último iPhone con todas las características premium',
                imageUrl: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop',
                price: 50,
                totalTickets: 100,
                sold: 0,
                endDate: new Date('2024-12-31T23:59:59.000Z'),
                isActive: true,
                status: 'active',
                slug: 'iphone-15-pro-max'
            }
        });
        console.log('✅ Rifa creada');

        // 4. Crear usuario de ejemplo
        console.log('👥 Creando usuario de ejemplo...');
        const user = await prisma.user.create({
            data: {
                email: 'juan@email.com',
                name: 'Juan Pérez'
            }
        });
        console.log('✅ Usuario creado');

        // 5. Crear orden de ejemplo
        console.log('📦 Creando orden de ejemplo...');
        await prisma.order.create({
            data: {
                folio: 'ORD-1704067200000',
                raffleId: '1',
                userId: user.id,
                tickets: [5, 10, 15],
                total: 150,
                status: 'PENDING',
                expiresAt: new Date('2024-01-02T10:00:00.000Z')
            }
        });
        console.log('✅ Orden creada');

        console.log('🎉 ¡Migración simple completada exitosamente!');
        
        // Mostrar resumen
        const userCount = await prisma.user.count();
        const raffleCount = await prisma.raffle.count();
        const orderCount = await prisma.order.count();
        
        console.log(`📊 Resumen:`);
        console.log(`   - Usuarios: ${userCount}`);
        console.log(`   - Rifas: ${raffleCount}`);
        console.log(`   - Órdenes: ${orderCount}`);

    } catch (error) {
        console.error('❌ Error durante la migración:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar migración si se llama directamente
if (require.main === module) {
    simpleMigrate()
        .then(() => {
            console.log('✅ Migración finalizada');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Error en migración:', error);
            process.exit(1);
        });
}

module.exports = { simpleMigrate };
