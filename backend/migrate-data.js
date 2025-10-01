// Script para migrar datos de JSON a PostgreSQL
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Configurar URL de base de datos específica
const DATABASE_URL = 'postgresql://postgres:ZuCkGpLHcIJynmWvsMEqzIzypbuXotKm@nozomi.proxy.rlwy.net:50670/railway';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL
    }
  }
});

// Rutas de archivos JSON
const DATA_DIR = path.join(__dirname, 'data');
const RAFFLES_FILE = path.join(DATA_DIR, 'raffles.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const WINNERS_FILE = path.join(DATA_DIR, 'winners.json');

// Función para cargar datos desde archivos
const loadData = (filePath, defaultValue) => {
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error(`Error loading ${filePath}:`, error);
    }
    return defaultValue;
};

async function migrateData() {
    console.log('🚀 Iniciando migración de datos...');
    
    try {
        // 1. Migrar Settings
        console.log('📝 Migrando configuración...');
        const settings = loadData(SETTINGS_FILE, {});
        if (settings && Object.keys(settings).length > 0) {
            await prisma.settings.upsert({
                where: { id: settings.id || 'main_settings' },
                update: {
                    siteName: settings.siteName || 'Lucky Snap',
                    paymentAccounts: settings.paymentAccounts || [],
                    faqs: settings.faqs || []
                },
                create: {
                    id: settings.id || 'main_settings',
                    siteName: settings.siteName || 'Lucky Snap',
                    paymentAccounts: settings.paymentAccounts || [],
                    faqs: settings.faqs || []
                }
            });
            console.log('✅ Configuración migrada');
        }

        // 2. Migrar Usuarios Admin
        console.log('👤 Migrando usuarios admin...');
        const users = loadData(USERS_FILE, []);
        for (const user of users) {
            if (user.email) {
                await prisma.adminUser.upsert({
                    where: { email: user.email },
                    update: {
                        name: user.name || 'Admin',
                        password: user.password || 'admin123'
                    },
                    create: {
                        email: user.email,
                        name: user.name || 'Admin',
                        password: user.password || 'admin123'
                    }
                });
            }
        }
        console.log('✅ Usuarios admin migrados');

        // 3. Migrar Rifas
        console.log('🎫 Migrando rifas...');
        const raffles = loadData(RAFFLES_FILE, []);
        for (const raffle of raffles) {
            await prisma.raffle.upsert({
                where: { id: raffle.id },
                update: {
                    title: raffle.title,
                    description: raffle.description || '',
                    heroImage: raffle.heroImage || '',
                    gallery: raffle.gallery || [],
                    price: raffle.packs && raffle.packs[0] ? raffle.packs[0].price : 50,
                    tickets: raffle.tickets || 100,
                    sold: raffle.sold || 0,
                    drawDate: new Date(raffle.drawDate),
                    packs: raffle.packs || [],
                    bonuses: raffle.bonuses || [],
                    status: raffle.status || 'draft',
                    slug: raffle.slug || ''
                },
                create: {
                    id: raffle.id,
                    title: raffle.title,
                    description: raffle.description || '',
                    heroImage: raffle.heroImage || '',
                    gallery: raffle.gallery || [],
                    price: raffle.packs && raffle.packs[0] ? raffle.packs[0].price : 50,
                    tickets: raffle.tickets || 100,
                    sold: raffle.sold || 0,
                    drawDate: new Date(raffle.drawDate),
                    packs: raffle.packs || [],
                    bonuses: raffle.bonuses || [],
                    status: raffle.status || 'draft',
                    slug: raffle.slug || ''
                }
            });
        }
        console.log('✅ Rifas migradas');

        // 4. Migrar Órdenes y Usuarios
        console.log('📦 Migrando órdenes y usuarios...');
        const orders = loadData(ORDERS_FILE, []);
        
        for (const order of orders) {
            if (order.customer && order.customer.phone) {
                // Crear o actualizar usuario
                const user = await prisma.user.upsert({
                    where: { email: order.customer.email || `${order.customer.phone}@temp.com` },
                    update: {
                        name: order.customer.name,
                        phone: order.customer.phone,
                        district: order.customer.district || ''
                    },
                    create: {
                        email: order.customer.email || `${order.customer.phone}@temp.com`,
                        name: order.customer.name,
                        phone: order.customer.phone,
                        district: order.customer.district || ''
                    }
                });

                // Crear orden
                await prisma.order.upsert({
                    where: { id: order.id },
                    update: {
                        folio: order.folio,
                        raffleId: order.raffleId,
                        userId: user.id,
                        tickets: order.tickets || [],
                        totalAmount: order.totalAmount || 0,
                        status: order.status || 'PENDING',
                        paymentMethod: order.paymentMethod || 'transfer',
                        notes: order.notes || '',
                        expiresAt: new Date(order.expiresAt)
                    },
                    create: {
                        id: order.id,
                        folio: order.folio,
                        raffleId: order.raffleId,
                        userId: user.id,
                        tickets: order.tickets || [],
                        totalAmount: order.totalAmount || 0,
                        status: order.status || 'PENDING',
                        paymentMethod: order.paymentMethod || 'transfer',
                        notes: order.notes || '',
                        expiresAt: new Date(order.expiresAt)
                    }
                });
            }
        }
        console.log('✅ Órdenes y usuarios migrados');

        // 5. Migrar Ganadores
        console.log('🏆 Migrando ganadores...');
        const winners = loadData(WINNERS_FILE, []);
        for (const winner of winners) {
            // Buscar usuario por email o crear uno temporal
            let user = await prisma.user.findFirst({
                where: { 
                    OR: [
                        { email: winner.email },
                        { phone: winner.phone }
                    ]
                }
            });

            if (!user) {
                user = await prisma.user.create({
                    data: {
                        email: winner.email || `${winner.phone || 'temp'}@temp.com`,
                        name: winner.name || 'Ganador',
                        phone: winner.phone || '',
                        district: winner.district || ''
                    }
                });
            }

            await prisma.winner.upsert({
                where: { id: winner.id },
                update: {
                    raffleId: winner.raffleId,
                    userId: user.id,
                    ticketId: winner.ticketId || `ticket-${Date.now()}`
                },
                create: {
                    id: winner.id,
                    raffleId: winner.raffleId,
                    userId: user.id,
                    ticketId: winner.ticketId || `ticket-${Date.now()}`
                }
            });
        }
        console.log('✅ Ganadores migrados');

        console.log('🎉 ¡Migración completada exitosamente!');
        console.log(`📊 Resumen:`);
        console.log(`   - Rifas: ${raffles.length}`);
        console.log(`   - Órdenes: ${orders.length}`);
        console.log(`   - Usuarios: ${await prisma.user.count()}`);
        console.log(`   - Ganadores: ${winners.length}`);

    } catch (error) {
        console.error('❌ Error durante la migración:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar migración si se llama directamente
if (require.main === module) {
    migrateData()
        .then(() => {
            console.log('✅ Migración finalizada');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Error en migración:', error);
            process.exit(1);
        });
}

module.exports = { migrateData };
