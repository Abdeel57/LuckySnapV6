#!/usr/bin/env node

/**
 * 🚀 Lucky Snap Backend - Solución Inmediata
 * 
 * Este backend funciona inmediatamente sin necesidad de deploy
 * Resuelve TODOS los problemas de JSON y apartado de boletos
 */

import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración CORS para permitir todas las conexiones
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Inicializar Prisma
let prisma;
try {
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/lucky_snap'
      }
    }
  });
  console.log('✅ Prisma inicializado correctamente');
} catch (error) {
  console.error('❌ Error inicializando Prisma:', error);
  process.exit(1);
}

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Backend funcionando correctamente',
    version: '1.0.0-immediate'
  });
});

// ===== ENDPOINTS CRÍTICOS PARA APARTADO DE BOLETOS =====

// Crear orden (APARTADO DE BOLETOS)
app.post('/api/public/orders', async (req, res) => {
  try {
    console.log('🛒 === CREANDO NUEVA ORDEN ===');
    console.log('📤 Datos recibidos:', JSON.stringify(req.body, null, 2));
    
    const { raffleId, userId, tickets, totalAmount, customer } = req.body;
    
    // Validaciones críticas
    if (!raffleId) {
      return res.status(400).json({
        success: false,
        error: 'RaffleId es requerido',
        message: 'Se debe especificar la rifa'
      });
    }
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'UserId es requerido',
        message: 'Se debe especificar el usuario'
      });
    }
    
    if (!tickets || !Array.isArray(tickets) || tickets.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Tickets inválidos',
        message: 'Se deben especificar los números de boletos'
      });
    }
    
    // Verificar que la rifa existe
    const raffle = await prisma.raffle.findUnique({ 
      where: { id: raffleId },
      select: { id: true, title: true, price: true, status: true }
    });
    
    if (!raffle) {
      return res.status(404).json({
        success: false,
        error: 'Rifa no encontrada',
        message: `La rifa con ID ${raffleId} no existe`
      });
    }
    
    console.log('✅ Rifa encontrada:', raffle.title);
    
    // Crear o encontrar usuario
    let user;
    try {
      user = await prisma.user.findUnique({ 
        where: { id: userId },
        select: { id: true, name: true, email: true, phone: true, district: true }
      });
      
      if (!user) {
        // Crear usuario si no existe
        const userData = {
          id: userId,
          name: customer?.name || 'Cliente',
          email: customer?.email || '',
          phone: customer?.phone || '',
          district: customer?.district || ''
        };
        
        user = await prisma.user.create({
          data: userData,
          select: { id: true, name: true, email: true, phone: true, district: true }
        });
        
        console.log('✅ Usuario creado:', user.name);
      } else {
        console.log('✅ Usuario encontrado:', user.name);
      }
    } catch (userError) {
      console.error('❌ Error con usuario:', userError);
      return res.status(500).json({
        success: false,
        error: 'Error procesando usuario',
        message: userError.message
      });
    }
    
    // Generar folio único
    const folio = `LKSNP-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    
    // Calcular fecha de expiración (24 horas)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    // Calcular total si no se proporciona
    const finalTotal = totalAmount || (tickets.length * raffle.price);
    
    console.log('📊 Datos de la orden:', {
      folio,
      raffleId,
      userId: user.id,
      tickets: tickets.length,
      total: finalTotal,
      expiresAt
    });
    
    // Crear la orden
    const newOrder = await prisma.order.create({
      data: {
        folio,
        raffleId,
        userId: user.id,
        tickets,
        totalAmount: finalTotal,
        status: 'PENDING',
        expiresAt
      },
      include: {
        raffle: {
          select: {
            id: true,
            title: true,
            price: true
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
      }
    });
    
    // Actualizar contador de boletos vendidos
    await prisma.raffle.update({
      where: { id: raffleId },
      data: { sold: { increment: tickets.length } }
    });
    
    console.log(`✅ Orden creada exitosamente: ${folio}`);
    console.log('📋 Orden completa:', JSON.stringify(newOrder, null, 2));
    
    // Respuesta garantizada válida
    res.json({
      success: true,
      data: newOrder,
      message: 'Orden creada exitosamente'
    });
    
  } catch (error) {
    console.error('❌ Error crítico creando orden:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Obtener órdenes para admin
app.get('/api/admin/orders', async (req, res) => {
  try {
    console.log('📋 Obteniendo órdenes para admin...');
    
    const orders = await prisma.order.findMany({
      include: {
        raffle: {
          select: {
            id: true,
            title: true,
            price: true
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
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`✅ Órdenes obtenidas: ${orders.length}`);
    
    // Transformar datos para el frontend
    const transformedOrders = orders.map(order => ({
      id: order.id,
      folio: order.folio,
      raffleId: order.raffleId,
      userId: order.userId,
      tickets: order.tickets,
      totalAmount: order.totalAmount,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      expiresAt: order.expiresAt,
      raffle: order.raffle,
      customer: {
        name: order.user.name || 'Sin nombre',
        email: order.user.email || '',
        phone: order.user.phone || '',
        district: order.user.district || ''
      }
    }));
    
    // Respuesta garantizada válida
    res.json(transformedOrders);
    
  } catch (error) {
    console.error('❌ Error obteniendo órdenes:', error);
    res.status(500).json([]);
  }
});

// Obtener rifas para admin
app.get('/api/admin/raffles', async (req, res) => {
  try {
    console.log('🎯 Obteniendo rifas para admin...');
    
    const raffles = await prisma.raffle.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`✅ Rifas obtenidas: ${raffles.length}`);
    
    // Respuesta garantizada válida
    res.json(raffles);
    
  } catch (error) {
    console.error('❌ Error obteniendo rifas:', error);
    res.status(500).json([]);
  }
});

// Obtener rifas activas
app.get('/api/public/raffles/active', async (req, res) => {
  try {
    console.log('🎯 Obteniendo rifas activas...');
    
    const raffles = await prisma.raffle.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`✅ Rifas activas obtenidas: ${raffles.length}`);
    
    // Respuesta garantizada válida
    res.json(raffles);
    
  } catch (error) {
    console.error('❌ Error obteniendo rifas activas:', error);
    res.status(500).json([]);
  }
});

// Obtener rifa por slug
app.get('/api/public/raffles/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    console.log('🔍 Obteniendo rifa por slug:', slug);
    
    const raffle = await prisma.raffle.findUnique({
      where: { slug }
    });
    
    if (!raffle) {
      return res.status(404).json({
        success: false,
        error: 'Rifa no encontrada',
        message: `No se encontró una rifa con slug ${slug}`
      });
    }
    
    console.log('✅ Rifa encontrada:', raffle.title);
    res.json(raffle);
    
  } catch (error) {
    console.error('❌ Error obteniendo rifa por slug:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// Obtener boletos ocupados
app.get('/api/public/raffles/:id/occupied-tickets', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🎫 Obteniendo boletos ocupados para rifa:', id);
    
    const orders = await prisma.order.findMany({
      where: {
        raffleId: id,
        status: { in: ['PENDING', 'COMPLETED'] }
      },
      select: { tickets: true }
    });
    
    const occupiedTickets = orders.flatMap(o => o.tickets);
    console.log(`✅ Boletos ocupados obtenidos: ${occupiedTickets.length}`);
    
    res.json(occupiedTickets);
    
  } catch (error) {
    console.error('❌ Error obteniendo boletos ocupados:', error);
    res.status(500).json([]);
  }
});

// Configuración
app.get('/api/public/settings', (req, res) => {
  res.json({
    id: 'main_settings',
    siteName: 'Lucky Snap',
    paymentAccounts: [],
    faqs: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
});

// Manejo de errores global
app.use((error, req, res, next) => {
  console.error('❌ Error global:', error);
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('🚀 Lucky Snap Backend - Solución Inmediata');
  console.log(`🌐 Servidor funcionando en puerto ${PORT}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
  console.log('✅ Backend listo para recibir peticiones');
  console.log('🎯 Apartado de boletos completamente funcional');
});

// Manejo de cierre graceful
process.on('SIGINT', async () => {
  console.log('\n🛑 Cerrando servidor...');
  if (prisma) {
    await prisma.$disconnect();
  }
  process.exit(0);
});






