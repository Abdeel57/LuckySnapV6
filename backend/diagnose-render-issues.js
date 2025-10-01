#!/usr/bin/env node

/**
 * 🔍 DIAGNÓSTICO ESPECÍFICO PARA RENDER
 * 
 * Este script identifica y corrige los problemas específicos
 * que están causando los errores 500 en Render.
 */

const { PrismaClient } = require('@prisma/client');

// Configuración de diagnóstico
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:ZuCkGpLHcIJynmWvsMEqzIzypbuXotKm@nozomi.proxy.rlwy.net:50670/railway';

console.log('🔍 DIAGNÓSTICO DE PROBLEMAS EN RENDER');
console.log('=====================================');

async function diagnoseRenderIssues() {
  let prisma;
  
  try {
    // 1. Verificar conexión a base de datos
    console.log('\n1️⃣ Verificando conexión a base de datos...');
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: DATABASE_URL
        }
      },
      log: ['error', 'warn', 'info'],
      errorFormat: 'pretty'
    });

    await prisma.$connect();
    console.log('✅ Conexión a base de datos exitosa');

    // 2. Verificar estructura de tablas
    console.log('\n2️⃣ Verificando estructura de tablas...');
    
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    console.log('📋 Tablas encontradas:', tables.map(t => t.table_name));
    
    // 3. Verificar tabla de órdenes específicamente
    console.log('\n3️⃣ Verificando tabla de órdenes...');
    
    const orderColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'orders'
    `;
    
    console.log('📋 Columnas de orders:', orderColumns);
    
    // 4. Verificar datos existentes
    console.log('\n4️⃣ Verificando datos existentes...');
    
    const orderCount = await prisma.order.count();
    const raffleCount = await prisma.raffle.count();
    const userCount = await prisma.user.count();
    
    console.log(`📊 Órdenes: ${orderCount}`);
    console.log(`📊 Rifas: ${raffleCount}`);
    console.log(`📊 Usuarios: ${userCount}`);
    
    // 5. Probar consulta específica que falla
    console.log('\n5️⃣ Probando consulta de órdenes con includes...');
    
    try {
      const orders = await prisma.order.findMany({
        include: {
          raffle: {
            select: {
              id: true,
              title: true,
              price: true,
              status: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              district: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5 // Solo las primeras 5 para evitar problemas de memoria
      });
      
      console.log('✅ Consulta de órdenes exitosa');
      console.log(`📋 Órdenes obtenidas: ${orders.length}`);
      
      if (orders.length > 0) {
        console.log('📄 Ejemplo de orden:');
        console.log(JSON.stringify(orders[0], null, 2));
      }
      
    } catch (queryError) {
      console.error('❌ Error en consulta de órdenes:', queryError);
      
      // Intentar consulta más simple
      console.log('\n🔄 Intentando consulta simple...');
      try {
        const simpleOrders = await prisma.order.findMany({
          take: 5
        });
        console.log('✅ Consulta simple exitosa');
        console.log(`📋 Órdenes simples: ${simpleOrders.length}`);
      } catch (simpleError) {
        console.error('❌ Error en consulta simple:', simpleError);
      }
    }
    
    // 6. Verificar problemas de memoria/recursos
    console.log('\n6️⃣ Verificando recursos del sistema...');
    const memUsage = process.memoryUsage();
    console.log(`💾 Memoria usada: ${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`);
    console.log(`💾 Memoria total: ${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`);
    
    // 7. Verificar variables de entorno críticas
    console.log('\n7️⃣ Verificando variables de entorno...');
    console.log(`🌐 NODE_ENV: ${process.env.NODE_ENV || 'no definido'}`);
    console.log(`🔌 PORT: ${process.env.PORT || 'no definido'}`);
    console.log(`🗄️ DATABASE_URL: ${DATABASE_URL ? 'configurada' : 'no configurada'}`);
    
    // 8. Generar recomendaciones
    console.log('\n8️⃣ RECOMENDACIONES:');
    
    if (orderCount === 0) {
      console.log('⚠️ No hay órdenes en la base de datos');
      console.log('💡 Recomendación: Crear datos de prueba');
    }
    
    if (raffleCount === 0) {
      console.log('⚠️ No hay rifas en la base de datos');
      console.log('💡 Recomendación: Crear rifas de prueba');
    }
    
    if (userCount === 0) {
      console.log('⚠️ No hay usuarios en la base de datos');
      console.log('💡 Recomendación: Crear usuarios de prueba');
    }
    
    console.log('\n✅ Diagnóstico completado');
    
  } catch (error) {
    console.error('\n❌ ERROR CRÍTICO EN DIAGNÓSTICO:', error);
    console.error('📋 Detalles del error:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    });
    
    // Sugerencias de solución
    console.log('\n🔧 POSIBLES SOLUCIONES:');
    console.log('1. Verificar que la base de datos esté activa en Railway');
    console.log('2. Verificar que las migraciones de Prisma se hayan ejecutado');
    console.log('3. Verificar que la URL de conexión sea correcta');
    console.log('4. Reiniciar el servicio en Render');
    
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}

// Ejecutar diagnóstico
diagnoseRenderIssues()
  .then(() => {
    console.log('\n🎉 Diagnóstico finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  });
