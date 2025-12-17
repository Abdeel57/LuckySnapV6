#!/usr/bin/env node

/**
 * 🗄️ MIGRACIÓN DE BASE DE DATOS PARA RENDER
 * 
 * Este script asegura que la base de datos tenga la estructura correcta
 * y datos de prueba para que el backend funcione correctamente.
 */

const { PrismaClient } = require('@prisma/client');

const DATABASE_URL = process.env.DATABASE_URL;

console.log('🗄️ MIGRACIÓN DE BASE DE DATOS PARA RENDER');
console.log('==========================================');

async function migrateRenderDatabase() {
  let prisma;
  
  try {
    // Inicializar Prisma
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: DATABASE_URL
        }
      },
      log: ['query', 'info', 'warn', 'error'],
      errorFormat: 'pretty'
    });

    await prisma.$connect();
    console.log('✅ Conectado a la base de datos');

    // 1. Verificar y crear tablas si no existen
    console.log('\n1️⃣ Verificando estructura de tablas...');
    
    // Verificar si existe la tabla orders
    const ordersTable = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'orders'
      );
    `;
    
    if (!ordersTable[0].exists) {
      console.log('⚠️ Tabla orders no existe, ejecutando migración...');
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "orders" (
          "id" TEXT NOT NULL,
          "folio" TEXT NOT NULL,
          "raffleId" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "tickets" INTEGER[],
          "totalAmount" DOUBLE PRECISION NOT NULL,
          "total" DOUBLE PRECISION,
          "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
          "paymentMethod" TEXT,
          "notes" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          "expiresAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
        );
      `;
      console.log('✅ Tabla orders creada');
    } else {
      console.log('✅ Tabla orders existe');
    }

    // Verificar si existe la tabla raffles
    const rafflesTable = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'raffles'
      );
    `;
    
    if (!rafflesTable[0].exists) {
      console.log('⚠️ Tabla raffles no existe, ejecutando migración...');
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "raffles" (
          "id" TEXT NOT NULL,
          "title" TEXT NOT NULL,
          "description" TEXT,
          "heroImage" TEXT,
          "gallery" TEXT[],
          "price" DOUBLE PRECISION NOT NULL DEFAULT 50.0,
          "tickets" INTEGER NOT NULL,
          "sold" INTEGER NOT NULL DEFAULT 0,
          "drawDate" TIMESTAMP(3) NOT NULL,
          "packs" JSONB,
          "bonuses" TEXT[],
          "status" TEXT NOT NULL DEFAULT 'draft',
          "slug" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "raffles_pkey" PRIMARY KEY ("id")
        );
      `;
      console.log('✅ Tabla raffles creada');
    } else {
      console.log('✅ Tabla raffles existe');
    }

    // Verificar si existe la tabla users
    const usersTable = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `;
    
    if (!usersTable[0].exists) {
      console.log('⚠️ Tabla users no existe, ejecutando migración...');
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "users" (
          "id" TEXT NOT NULL,
          "email" TEXT NOT NULL,
          "name" TEXT,
          "phone" TEXT,
          "district" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "users_pkey" PRIMARY KEY ("id")
        );
      `;
      console.log('✅ Tabla users creada');
    } else {
      console.log('✅ Tabla users existe');
    }

    // 2. Crear datos de prueba si no existen
    console.log('\n2️⃣ Verificando datos de prueba...');
    
    // Verificar si hay rifas
    const raffleCount = await prisma.raffle.count();
    if (raffleCount === 0) {
      console.log('📝 Creando rifas de prueba...');
      
      const testRaffles = [
        {
          id: 'raffle-1',
          title: 'iPhone 15 Pro Max',
          description: 'El último iPhone con todas las características premium',
          heroImage: 'https://via.placeholder.com/400x300/007AFF/FFFFFF?text=iPhone+15+Pro+Max',
          gallery: [
            'https://via.placeholder.com/400x300/007AFF/FFFFFF?text=iPhone+15+Pro+Max+1',
            'https://via.placeholder.com/400x300/007AFF/FFFFFF?text=iPhone+15+Pro+Max+2'
          ],
          price: 50,
          tickets: 100,
          sold: 0,
          drawDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
          packs: [
            { q: 1, price: 50, name: '1 Boleto' },
            { q: 3, price: 140, name: '3 Boletos' },
            { q: 5, price: 225, name: '5 Boletos' }
          ],
          bonuses: ['Envío gratis', 'Garantía extendida'],
          status: 'active',
          slug: 'iphone-15-pro-max'
        },
        {
          id: 'raffle-2',
          title: 'MacBook Pro M3',
          description: 'La laptop más potente de Apple con chip M3',
          heroImage: 'https://via.placeholder.com/400x300/34C759/FFFFFF?text=MacBook+Pro+M3',
          gallery: [
            'https://via.placeholder.com/400x300/34C759/FFFFFF?text=MacBook+Pro+M3+1',
            'https://via.placeholder.com/400x300/34C759/FFFFFF?text=MacBook+Pro+M3+2'
          ],
          price: 75,
          tickets: 80,
          sold: 0,
          drawDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 días
          packs: [
            { q: 1, price: 75, name: '1 Boleto' },
            { q: 2, price: 140, name: '2 Boletos' },
            { q: 4, price: 270, name: '4 Boletos' }
          ],
          bonuses: ['Accesorios incluidos', 'Soporte técnico'],
          status: 'active',
          slug: 'macbook-pro-m3'
        }
      ];

      for (const raffle of testRaffles) {
        await prisma.raffle.create({ data: raffle });
      }
      
      console.log(`✅ ${testRaffles.length} rifas de prueba creadas`);
    } else {
      console.log(`✅ Ya existen ${raffleCount} rifas`);
    }

    // Verificar si hay usuarios
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      console.log('📝 Creando usuarios de prueba...');
      
      const testUsers = [
        {
          id: 'user-1',
          name: 'Juan Pérez',
          email: 'juan@email.com',
          phone: '5551234567',
          district: 'Centro'
        },
        {
          id: 'user-2',
          name: 'María García',
          email: 'maria@email.com',
          phone: '5557654321',
          district: 'Norte'
        },
        {
          id: 'user-3',
          name: 'Carlos López',
          email: 'carlos@email.com',
          phone: '5559876543',
          district: 'Sur'
        }
      ];

      for (const user of testUsers) {
        await prisma.user.create({ data: user });
      }
      
      console.log(`✅ ${testUsers.length} usuarios de prueba creados`);
    } else {
      console.log(`✅ Ya existen ${userCount} usuarios`);
    }

    // Verificar si hay órdenes
    const orderCount = await prisma.order.count();
    if (orderCount === 0) {
      console.log('📝 Creando órdenes de prueba...');
      
      const testOrders = [
        {
          id: 'order-1',
          folio: 'LKSNP-ABC123',
          raffleId: 'raffle-1',
          userId: 'user-1',
          tickets: [5, 10, 15],
          totalAmount: 150,
          total: 150,
          status: 'PENDING',
          paymentMethod: 'transfer',
          notes: 'Cliente frecuente',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        },
        {
          id: 'order-2',
          folio: 'LKSNP-DEF456',
          raffleId: 'raffle-1',
          userId: 'user-2',
          tickets: [25, 30],
          totalAmount: 100,
          total: 100,
          status: 'COMPLETED',
          paymentMethod: 'transfer',
          notes: '',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        },
        {
          id: 'order-3',
          folio: 'LKSNP-GHI789',
          raffleId: 'raffle-2',
          userId: 'user-3',
          tickets: [1, 2, 3],
          totalAmount: 225,
          total: 225,
          status: 'PENDING',
          paymentMethod: 'transfer',
          notes: 'Primera compra',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      ];

      for (const order of testOrders) {
        await prisma.order.create({ data: order });
      }
      
      // Actualizar contador de boletos vendidos
      await prisma.raffle.update({
        where: { id: 'raffle-1' },
        data: { sold: 5 } // 5 boletos vendidos
      });
      
      await prisma.raffle.update({
        where: { id: 'raffle-2' },
        data: { sold: 3 } // 3 boletos vendidos
      });
      
      console.log(`✅ ${testOrders.length} órdenes de prueba creadas`);
    } else {
      console.log(`✅ Ya existen ${orderCount} órdenes`);
    }

    // 3. Verificar índices y constraints
    console.log('\n3️⃣ Verificando índices y constraints...');
    
    // Crear índice único en folio si no existe
    try {
      await prisma.$executeRaw`
        CREATE UNIQUE INDEX IF NOT EXISTS "orders_folio_key" ON "orders"("folio");
      `;
      console.log('✅ Índice único en folio creado');
    } catch (error) {
      console.log('ℹ️ Índice único en folio ya existe');
    }

    // Crear índice único en slug de rifas si no existe
    try {
      await prisma.$executeRaw`
        CREATE UNIQUE INDEX IF NOT EXISTS "raffles_slug_key" ON "raffles"("slug");
      `;
      console.log('✅ Índice único en slug creado');
    } catch (error) {
      console.log('ℹ️ Índice único en slug ya existe');
    }

    // 4. Verificar estado final
    console.log('\n4️⃣ Estado final de la base de datos:');
    
    const finalCounts = await Promise.all([
      prisma.raffle.count(),
      prisma.user.count(),
      prisma.order.count()
    ]);
    
    console.log(`📊 Rifas: ${finalCounts[0]}`);
    console.log(`📊 Usuarios: ${finalCounts[1]}`);
    console.log(`📊 Órdenes: ${finalCounts[2]}`);
    
    console.log('\n✅ Migración completada exitosamente');
    
  } catch (error) {
    console.error('\n❌ ERROR EN MIGRACIÓN:', error);
    console.error('📋 Detalles del error:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    });
    throw error;
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}

// Ejecutar migración
migrateRenderDatabase()
  .then(() => {
    console.log('\n🎉 Migración de base de datos finalizada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error fatal en migración:', error);
    process.exit(1);
  });
