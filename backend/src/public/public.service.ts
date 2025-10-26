import { Injectable, NotFoundException } from '@nestjs/common';
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
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRaffleBySlug(slug: string) {
    return this.prisma.raffle.findUnique({
      where: { slug },
    });
  }

  async getOccupiedTickets(raffleId: string) {
    const orders = await this.prisma.order.findMany({
      where: {
        raffleId,
        status: { in: ['PAID', 'PENDING'] },
      },
      select: { tickets: true },
    });
    return orders.flatMap(o => o.tickets);
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
        },
        socialLinks: {
          facebookUrl: '',
          instagramUrl: '',
          twitterUrl: '',
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
      },
      socialLinks: {
        facebookUrl: settings.facebookUrl || '',
        instagramUrl: settings.instagramUrl || '',
        twitterUrl: settings.twitterUrl || '',
      },
      paymentAccounts: this.parseJsonField(settings.paymentAccounts),
      faqs: this.parseJsonField(settings.faqs),
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
}
