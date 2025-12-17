import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
// FIX: Using `import type` for Prisma namespace and a value import for the OrderStatus enum.
import { type Prisma } from '@prisma/client';
import { add } from 'date-fns';

@Injectable()
export class PublicService {
  constructor(private prisma: PrismaService) {}

  async getActiveRaffles() {
    return this.prisma.raffle.findMany({
      where: { status: 'active' },
      orderBy: { drawDate: 'asc' }, // Ordenar por fecha de sorteo (más próximas primero)
    });
  }

  async getRaffleBySlug(slug: string) {
    return this.prisma.raffle.findUnique({
      where: { slug },
    });
  }

  async getOccupiedTickets(
    raffleId: string,
    options?: {
      offset?: number;
      limit?: number;
      sortDirection?: 'asc' | 'desc';
    },
  ) {
    const offset = Math.max(0, options?.offset ?? 0);
    const rawLimit = options?.limit;
    const limit = typeof rawLimit === 'number' && rawLimit > 0 ? Math.min(rawLimit, 2000) : undefined;
    const sortDirection = options?.sortDirection === 'desc' ? 'desc' : 'asc';

    const orders = await this.prisma.order.findMany({
      where: {
        raffleId,
        status: { in: ['PAID', 'PENDING'] },
      },
      select: { tickets: true },
    });

    const allTickets = orders.flatMap(o => o.tickets).filter((ticket): ticket is number => typeof ticket === 'number');

    const sortedTickets = sortDirection === 'desc'
      ? [...allTickets].sort((a, b) => b - a)
      : [...allTickets].sort((a, b) => a - b);

    const total = sortedTickets.length;

    if (!limit) {
      return {
        tickets: sortedTickets,
        total,
        hasMore: false,
        nextOffset: null,
      };
    }

    const start = Math.min(offset, Math.max(total - 1, 0));
    const end = Math.min(start + limit, total);
    const pageTickets = sortedTickets.slice(start, end);
    const nextOffset = end < total ? end : null;

    return {
      tickets: pageTickets,
      total,
      hasMore: end < total,
      nextOffset,
    };
  }

  async getPastWinners() {
    return this.prisma.winner.findMany({
        orderBy: { createdAt: 'desc' }
    });
  }

  async getSettings() {
    try {
      console.log('🔧 Getting settings from database...');
      
      const settings = await this.prisma.settings.findUnique({
        where: { id: 'main_settings' },
      });
      
      if (!settings) {
        console.log('⚠️ No settings found, creating default settings');
        // Create default settings if they don't exist
        const newSettings = await this.prisma.settings.create({
          data: {
            id: 'main_settings',
            siteName: 'Lucky Snap',
            logoAnimation: 'rotate',
            primaryColor: '#111827',
            secondaryColor: '#1f2937',
            accentColor: '#ec4899',
            actionColor: '#0ea5e9',
            paymentAccounts: JSON.stringify([]),
            faqs: JSON.stringify([]),
          },
        });
        
        return this.formatSettingsResponse(newSettings);
      }
      
      console.log('✅ Settings found:', settings);
      return this.formatSettingsResponse(settings);
    } catch (error) {
      console.error('❌ Error getting settings:', error);
      // Return default settings if there's an error
      return {
        id: 'main_settings',
        siteName: 'Lucky Snap',
        appearance: {
          siteName: 'Lucky Snap',
          logoAnimation: 'rotate',
          colors: {
            backgroundPrimary: '#111827',
            backgroundSecondary: '#1f2937',
            accent: '#ec4899',
            action: '#0ea5e9',
          }
        },
        contactInfo: {
          whatsapp: '',
          email: '',
          emailFromName: '',
          emailReplyTo: '',
          emailSubject: '',
        },
        socialLinks: {
          facebookUrl: '',
          instagramUrl: '',
          tiktokUrl: '',
        },
        paymentAccounts: [],
        faqs: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
  }

  private formatSettingsResponse(settings: any) {
    return {
      id: settings.id,
      siteName: settings.siteName,
      appearance: {
        siteName: settings.siteName,
        logo: settings.logo,
        favicon: settings.favicon,
        logoAnimation: settings.logoAnimation || 'rotate',
        colors: {
          backgroundPrimary: settings.primaryColor || '#111827',
          backgroundSecondary: settings.secondaryColor || '#1f2937',
          accent: settings.accentColor || '#ec4899',
          action: settings.actionColor || '#0ea5e9',
        }
      },
      contactInfo: {
        whatsapp: settings.whatsapp || '',
        email: settings.email || '',
        emailFromName: settings.emailFromName || '',
        emailReplyTo: settings.emailReplyTo || '',
        emailSubject: settings.emailSubject || '',
      },
      socialLinks: {
        facebookUrl: settings.facebookUrl || '',
        instagramUrl: settings.instagramUrl || '',
        tiktokUrl: settings.tiktokUrl || '',
      },
      paymentAccounts: this.parseJsonField(settings.paymentAccounts),
      faqs: this.parseJsonField(settings.faqs),
      displayPreferences: this.parseJsonField(settings.displayPreferences),
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
    };
  }

  private parseJsonField(field: any) {
    try {
      if (!field) return [];
      
      // Handle double serialization
      if (typeof field === 'string') {
        // Try to parse as JSON
        const parsed = JSON.parse(field);
        
        // If it's still a string, parse again
        if (typeof parsed === 'string') {
          return JSON.parse(parsed);
        }
        
        return parsed;
      }
      
      return field;
    } catch (error) {
      console.error('❌ Error parsing JSON field:', error);
      return [];
    }
  }

  async testDatabaseConnection() {
    try {
      // Simple query to test database connection
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      throw error;
    }
  }

  async createOrder(orderData: any) {
    try {
      console.log('📝 Creating order with data:', orderData);
      
      // Verificar que la rifa existe
      const raffle = await this.prisma.raffle.findUnique({ where: { id: orderData.raffleId } });
      if (!raffle) {
        throw new NotFoundException('Raffle not found');
      }
      
      console.log('✅ Raffle found:', raffle.title);

      // VALIDACIÓN: Verificar si los boletos ya están ocupados
      // Esto previene duplicados cuando dos personas intentan comprar los mismos boletos
      // o cuando se refresca la página y se reenvía el formulario
      if (orderData.tickets && orderData.tickets.length > 0) {
        const conflictingOrders = await this.prisma.order.findMany({
          where: {
            raffleId: orderData.raffleId,
            status: { in: ['PENDING', 'PAID'] },
            tickets: { hasSome: orderData.tickets }
          },
          select: { tickets: true }
        });

        if (conflictingOrders.length > 0) {
          // Aplanar array de tickets ocupados
          const occupiedTickets = new Set<number>();
          conflictingOrders.forEach(o => {
            o.tickets.forEach(t => occupiedTickets.add(t));
          });
          
          // Encontrar cuáles de los solicitados están ocupados
          const duplicates = orderData.tickets.filter((t: number) => occupiedTickets.has(t));
          
          if (duplicates.length > 0) {
            console.warn(`⚠️ Intento de compra de boletos ocupados: ${duplicates.join(', ')}`);
            throw new BadRequestException(`Lo sentimos, los siguientes boletos ya han sido ganados por otra persona: ${duplicates.join(', ')}`);
          }
        }
      }
      
      // Lógica de múltiples oportunidades
      let ticketsToSave = orderData.tickets;
      if (raffle.boletosConOportunidades && raffle.numeroOportunidades > 1) {
        console.log(`🎁 Generando boletos adicionales: ${raffle.numeroOportunidades - 1} por cada boleto comprado`);
        
        const totalEmisiones = raffle.tickets * raffle.numeroOportunidades;
        const boletosAdicionales: number[] = [];
        
        // Obtener todas las órdenes existentes para evitar duplicados
        const existingOrders = await this.prisma.order.findMany({
          where: { raffleId: orderData.raffleId },
          select: { tickets: true }
        });
        
        const ticketsUsados = new Set<number>();
        existingOrders.forEach(order => {
          order.tickets.forEach(ticket => ticketsUsados.add(ticket));
        });
        
        // Añadir tickets de esta orden a los usados
        orderData.tickets.forEach(ticket => ticketsUsados.add(ticket));
        
        console.log(`📊 Tickets ya usados: ${ticketsUsados.size}`);
        console.log(`📊 Rango total de emisiones: ${totalEmisiones}`);
        
        // Para cada boleto comprado, generar boletos adicionales aleatorios
        for (const ticketNum of orderData.tickets) {
          for (let i = 0; i < raffle.numeroOportunidades - 1; i++) {
            // Generar número aleatorio del rango extendido (tickets + 1 hasta totalEmisiones)
            let randomTicket: number;
            let attempts = 0;
            const maxAttempts = 1000; // Aumentado para escalas grandes
            
            do {
              randomTicket = Math.floor(Math.random() * (totalEmisiones - raffle.tickets) + raffle.tickets + 1);
              attempts++;
              
              // Prevenir bucle infinito
              if (attempts > maxAttempts) {
                console.warn(`⚠️ No se pudo generar boleto único después de ${maxAttempts} intentos`);
                // Como último recurso, generar un número secuencial basado en timestamp
                randomTicket = raffle.tickets + (Date.now() % (totalEmisiones - raffle.tickets)) + 1;
                break;
              }
            } while (ticketsUsados.has(randomTicket) || ticketNum === randomTicket || boletosAdicionales.includes(randomTicket));
            
            if (attempts <= maxAttempts) {
              boletosAdicionales.push(randomTicket);
              ticketsUsados.add(randomTicket); // Marcar como usado
            }
          }
        }
        
        // Combinar boletos originales con los adicionales
        ticketsToSave = [...orderData.tickets, ...boletosAdicionales];
        console.log(`✅ Boletos generados: ${ticketsToSave.length} total (${orderData.tickets.length} comprados + ${boletosAdicionales.length} de regalo)`);
        console.log(`📦 Boletos de regalo asignados: ${boletosAdicionales.join(', ')}`);
      }
      
      // Crear o buscar el usuario
      let user;
      const userData = orderData.userData || {};
      
      if (userData.email) {
        // Buscar usuario existente por email
        user = await this.prisma.user.findUnique({ where: { email: userData.email } });
      }
      
      if (!user) {
        // Crear nuevo usuario
        user = await this.prisma.user.create({
          data: {
            email: userData.email || `user-${Date.now()}@temp.com`,
            name: userData.name,
            phone: userData.phone,
            district: userData.district,
          },
        });
        console.log('✅ User created:', user.id);
      } else {
        console.log('✅ Existing user found:', user.id);
      }
      
      // Crear la orden con todos los tickets (comprados + de regalo)
      const newOrder = await this.prisma.order.create({
        data: {
          folio: `LKSNP-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
          raffleId: orderData.raffleId,
          userId: user.id,
          tickets: ticketsToSave, // Incluye tickets originales + boletos adicionales
          total: orderData.total,
          status: 'PENDING',
          paymentMethod: orderData.paymentMethod || 'transfer',
          notes: orderData.notes || '',
          expiresAt: add(new Date(), { hours: 24 }),
        },
        include: {
          raffle: true,
          user: true,
        },
      });

      console.log('✅ Order created:', newOrder.folio);
      console.log('📦 Tickets en la orden:', ticketsToSave.length, 'total');

      // Actualizar boletos vendidos (solo los comprados, no los de regalo)
      await this.prisma.raffle.update({
        where: { id: orderData.raffleId },
        data: { sold: { increment: Array.isArray(orderData.tickets) ? orderData.tickets.length : 0 } },
      });

      console.log('✅ Raffle updated with sold tickets');

      return newOrder;
    } catch (error) {
      console.error('❌ Error creating order:', error);
      throw error;
    }
  }

  async verifyTicket(data: { codigo_qr?: string; numero_boleto?: number; sorteo_id?: string }) {
    try {
      console.log('🔍 Verifying ticket:', data);

      let ticketNumber: number;
      let raffleId: string;

      // Si viene código QR, decodificarlo
      if (data.codigo_qr) {
        try {
          const qrData = JSON.parse(data.codigo_qr);
          ticketNumber = qrData.numero_boleto;
          raffleId = qrData.sorteo_id;
          console.log('📱 QR decoded:', { ticketNumber, raffleId });
        } catch (error) {
          throw new Error('Código QR inválido');
        }
      } else if (data.numero_boleto && data.sorteo_id) {
        ticketNumber = data.numero_boleto;
        raffleId = data.sorteo_id;
      } else {
        throw new Error('Se requiere código QR o número de boleto con ID de sorteo');
      }

      // Buscar la orden que contiene este boleto
      const order = await this.prisma.order.findFirst({
        where: {
          raffleId,
          tickets: {
            has: ticketNumber
          }
        },
        include: {
          user: true,
          raffle: true
        }
      });

      if (!order) {
        return {
          valido: false,
          mensaje: 'Boleto no encontrado',
          boleto: null
        };
      }

      // Verificar estado del boleto
      const isValid = order.status === 'PAID';
      const message = isValid 
        ? 'Boleto válido y pagado' 
        : order.status === 'PENDING' 
          ? 'Boleto apartado pero no pagado'
          : 'Boleto no válido';

      return {
        valido: isValid,
        mensaje: message,
        boleto: {
          numero: ticketNumber,
          sorteo: order.raffle.title,
          cliente: order.user.name || 'Sin nombre',
          estado: order.status,
          fecha_pago: order.status === 'PAID' ? order.updatedAt : null,
          folio: order.folio,
          monto: order.total
        }
      };

    } catch (error) {
      console.error('❌ Error verifying ticket:', error);
      throw error;
    }
  }

  async generateTicketQR(ticketNumber: number, raffleId: string): Promise<string> {
    try {
      const QRCode = require('qrcode');
      
      const qrData = {
        numero_boleto: ticketNumber,
        sorteo_id: raffleId,
        timestamp: new Date().toISOString()
      };

      const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));
      return qrCode;
    } catch (error) {
      console.error('❌ Error generating QR:', error);
      throw new Error('Error al generar código QR');
    }
  }

  async searchTickets(criteria: {
    numero_boleto?: number;
    nombre_cliente?: string;
    telefono?: string;
    folio?: string;
  }) {
    try {
      console.log('🔍 Searching tickets with criteria:', criteria);
      
      // Validar que al menos un criterio esté presente
      if (!criteria.numero_boleto && !criteria.nombre_cliente && !criteria.telefono && !criteria.folio) {
        throw new Error('Se requiere al menos un criterio de búsqueda');
      }
      
      const where: any = {
        // Excluir órdenes canceladas y expiradas de la búsqueda pública
        status: {
          in: ['PENDING', 'PAID']
        }
      };
      
      // Construir condiciones dinámicas
      if (criteria.numero_boleto) {
        where.tickets = {
          has: criteria.numero_boleto
        };
      }
      
      // Construir condiciones de usuario
      if (criteria.nombre_cliente || criteria.telefono) {
        where.user = {};
        
        if (criteria.nombre_cliente) {
          where.user.name = {
            contains: criteria.nombre_cliente,
            mode: 'insensitive'
          };
        }
        
        if (criteria.telefono) {
          // Limpiar teléfono: solo números
          const phoneCleaned = criteria.telefono.replace(/\D/g, '');
          where.user.phone = {
            contains: phoneCleaned
          };
        }
      }
      
      if (criteria.folio) {
        where.folio = {
          contains: criteria.folio,
          mode: 'insensitive'
        };
      }
      
      // Buscar órdenes solo de sorteos activos
      const orders = await this.prisma.order.findMany({
        where: {
          ...where,
          // Solo mostrar órdenes de rifas activas
          raffle: {
            status: 'active'
          }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
              district: true
            }
          },
          raffle: {
            select: {
              id: true,
              title: true,
              status: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 50 // Límite recomendado
      });
      
      if (orders.length === 0) {
        return {
          clientes: [],
          totalClientes: 0,
          totalOrdenes: 0
        };
      }
      
      // Agrupar órdenes por cliente (userId)
      const ordersByUser = new Map<string, typeof orders>();
      
      orders.forEach(order => {
        const userId = order.userId;
        if (!ordersByUser.has(userId)) {
          ordersByUser.set(userId, []);
        }
        ordersByUser.get(userId)!.push(order);
      });
      
      // Transformar a formato agrupado
      const clientesAgrupados = Array.from(ordersByUser.entries()).map(([userId, userOrders]) => {
        const primerOrder = userOrders[0];
        const totalBoletos = userOrders.reduce((sum, o) => sum + o.tickets.length, 0);
        const totalPagado = userOrders.reduce((sum, o) => sum + (o.status === 'PAID' ? o.total : 0), 0);
        
        return {
          clienteId: userId,
          nombre: primerOrder.user.name || 'Sin nombre',
          telefono: primerOrder.user.phone || 'Sin teléfono',
          distrito: primerOrder.user.district || 'Sin distrito',
          totalOrdenes: userOrders.length,
          totalBoletos: totalBoletos,
          totalPagado: totalPagado,
          ordenes: userOrders.map(order => ({
            ordenId: order.id,
            folio: order.folio,
            rifa: {
              id: order.raffle.id,
              titulo: order.raffle.title
            },
            boletos: order.tickets,
            cantidadBoletos: order.tickets.length,
            estado: order.status,
            monto: order.total,
            fechaCreacion: order.createdAt,
            fechaPago: order.status === 'PAID' ? order.updatedAt : null,
            metodoPago: (order as any).paymentMethod || null
          }))
        };
      });
      
      console.log(`✅ Found ${clientesAgrupados.length} clients with ${orders.length} orders`);
      
      return {
        clientes: clientesAgrupados,
        totalClientes: clientesAgrupados.length,
        totalOrdenes: orders.length
      };
    } catch (error) {
      console.error('❌ Error searching tickets:', error);
      throw error;
    }
  }

  async getOrderByFolio(folio: string) {
    try {
      console.log('🔍 Getting order by folio:', folio);
      
      const order = await this.prisma.order.findUnique({
        where: { folio },
        include: {
          raffle: {
            select: {
              id: true,
              title: true,
              price: true,
              status: true,
              slug: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              district: true,
            },
          },
        },
      });

      if (!order) {
        throw new NotFoundException(`Order with folio ${folio} not found`);
      }

      // Transformar los datos para que coincidan con el frontend
      const transformedOrder = {
        id: order.id,
        folio: order.folio,
        raffleId: order.raffleId,
        userId: order.userId,
        tickets: order.tickets,
        total: order.total,
        totalAmount: order.total, // Alias para compatibilidad
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        expiresAt: order.expiresAt,
        raffle: order.raffle,
        customer: {
          id: order.user.id,
          name: order.user.name || 'Sin nombre',
          phone: order.user.phone || '',
          email: order.user.email || '',
          district: order.user.district || '',
        },
      };

      console.log('✅ Order found by folio:', folio);
      return transformedOrder;
    } catch (error) {
      console.error('❌ Error getting order by folio:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(`Order with folio ${folio} not found`);
    }
  }
}
