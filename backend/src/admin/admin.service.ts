import { Injectable, NotFoundException, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
// FIX: Using `import type` for types/namespaces and value import for the enum to fix module resolution.
import { type Prisma, type Raffle, type Winner } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // Dashboard
  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaySales = await this.prisma.order.aggregate({
      _sum: { total: true },
      where: {
        status: 'PAID',
        createdAt: { gte: today },
      },
    });

    const pendingOrders = await this.prisma.order.count({
      where: { status: 'PENDING' },
    });

    const activeRaffles = await this.prisma.raffle.count({
      where: { status: 'active' },
    });

    return {
      todaySales: todaySales._sum.total || 0,
      pendingOrders,
      activeRaffles,
    };
  }

  // Orders
  async getAllOrders(page: number = 1, limit: number = 50, status?: string, raffleId?: string) {
    try {
      const skip = (page - 1) * limit;
      const where: any = {};
      if (status) where.status = status as any;
      if (raffleId) where.raffleId = raffleId;
      
      const [orders, total] = await Promise.all([
        this.prisma.order.findMany({
          where,
          include: {
            raffle: {
              select: {
                id: true,
                title: true,
                price: true,
                status: true,
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
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.order.count({ where }),
      ]);
      
      // Transformar los datos para que coincidan con el frontend
      const transformedOrders = orders.map(order => ({
        ...order,
        customer: {
          id: order.user.id,
          name: order.user.name || 'Sin nombre',
          phone: order.user.phone || 'Sin teléfono',
          email: order.user.email || '',
          district: order.user.district || 'Sin distrito',
        },
        raffleTitle: order.raffle.title,
        total: order.total,
      }));
      
      return {
        orders: transformedOrders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Error getting orders:', error);
      // Fallback para evitar crashes
      return {
        orders: [],
        pagination: { page: 1, limit, total: 0, pages: 0 },
      };
    }
  }
  
  async getOrderById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { raffle: true, user: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    return {
      ...order,
      customer: {
        id: order.user.id,
        name: order.user.name || 'Sin nombre',
        phone: order.user.phone || 'Sin teléfono',
        email: order.user.email || '',
        district: order.user.district || 'Sin distrito',
      },
      raffleTitle: order.raffle.title,
      total: order.total,
    };
  }
  
  async updateOrderStatus(folio: string, status: string) {
    const order = await this.prisma.order.findUnique({ where: { folio } });
    if (!order) {
        throw new NotFoundException('Order not found');
    }

    if (order.status === status) return order;

    // Handle ticket count adjustment if order is cancelled
    if (status === 'CANCELLED' && order.status !== 'CANCELLED') {
        await this.prisma.raffle.update({
            where: { id: order.raffleId },
            data: { sold: { decrement: order.tickets.length } },
        });
    }

    return this.prisma.order.update({
        where: { folio },
        data: { status: status as any },
    });
  }

  async updateOrder(id: string, orderData: any) {
    try {
      const order = await this.prisma.order.findUnique({ where: { id } });
      if (!order) {
        throw new NotFoundException('Order not found');
      }

      // Filtrar solo los campos que se pueden actualizar directamente
      const { id: _, raffle, user, customer, raffleTitle, createdAt, ...updateData } = orderData;

      // Actualizar la orden
      const updatedOrder = await this.prisma.order.update({
        where: { id },
        data: {
          ...updateData,
          updatedAt: new Date(),
        },
        include: {
          raffle: true,
          user: true,
        },
      });

      // Transformar los datos para el frontend
      return {
        ...updatedOrder,
        customer: {
          id: updatedOrder.user.id,
          name: updatedOrder.user.name || 'Sin nombre',
          phone: updatedOrder.user.phone || 'Sin teléfono',
          email: updatedOrder.user.email || '',
          district: updatedOrder.user.district || 'Sin distrito',
        },
        raffleTitle: updatedOrder.raffle.title,
        total: updatedOrder.total,
      };
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  }

  async markOrderPaid(id: string, paymentMethod?: string, notes?: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status === 'PAID') return order;

    // Preparar datos de actualización
    const updateData: any = { 
      status: 'PAID' as any, 
      updatedAt: new Date() 
    };

    // Agregar método de pago si se proporcionó
    if (paymentMethod) {
      updateData.paymentMethod = paymentMethod;
    }

    // Agregar notas si se proporcionaron
    if (notes) {
      updateData.notes = notes;
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: updateData,
      include: { raffle: true, user: true },
    });

    return {
      ...updated,
      customer: {
        id: updated.user.id,
        name: updated.user.name || 'Sin nombre',
        phone: updated.user.phone || 'Sin teléfono',
        email: updated.user.email || '',
        district: updated.user.district || 'Sin distrito',
      },
      raffleTitle: updated.raffle.title,
      total: updated.total,
    };
  }

  async editOrder(id: string, body: { customer?: any; tickets?: number[]; notes?: string }) {
    const order = await this.prisma.order.findUnique({ where: { id }, include: { user: true } });
    if (!order) throw new NotFoundException('Order not found');

    const dataToUpdate: any = { updatedAt: new Date() };

    // Validar y actualizar tickets
    if (body.tickets) {
      // Validación básica: no duplicados en la misma orden
      const uniqueTickets = Array.from(new Set(body.tickets));
      if (uniqueTickets.length !== body.tickets.length) {
        throw new BadRequestException('Boletos duplicados en la misma orden');
      }
      dataToUpdate.tickets = uniqueTickets;
    }

    // Notas
    if (body.notes !== undefined) {
      dataToUpdate.notes = body.notes;
    }

    // Actualizar datos del cliente (en tabla user)
    if (body.customer && Object.keys(body.customer).length > 0) {
      await this.prisma.user.update({
        where: { id: order.userId },
        data: {
          name: body.customer.name ?? order.user.name,
          phone: body.customer.phone ?? order.user.phone,
          email: body.customer.email ?? order.user.email,
          district: body.customer.district ?? order.user.district,
        },
      });
    }

    const updated = await this.prisma.order.update({ where: { id }, data: dataToUpdate, include: { raffle: true, user: true } });

    return {
      ...updated,
      customer: {
        id: updated.user.id,
        name: updated.user.name || 'Sin nombre',
        phone: updated.user.phone || 'Sin teléfono',
        email: updated.user.email || '',
        district: updated.user.district || 'Sin distrito',
      },
      raffleTitle: updated.raffle.title,
      total: updated.total,
    };
  }

  async releaseOrder(id: string) {
    try {
      console.log('📌 Iniciando releaseOrder para ID:', id);
      
      // 1. Buscar la orden
      const order = await this.prisma.order.findUnique({ 
        where: { id }, 
        include: { raffle: true, user: true } 
      });
      
      console.log('📌 Orden encontrada:', order?.id);
      console.log('📌 Status actual:', order?.status);
      console.log('📌 Tickets:', order?.tickets);
      console.log('📌 RaffleId:', order?.raffleId);
      
      if (!order) {
        throw new NotFoundException('Orden no encontrada');
      }

      // 2. Validar que existan los datos necesarios
      if (!order.raffleId || !Array.isArray(order.tickets)) {
        throw new BadRequestException('Datos de orden inválidos');
      }

      // 3. Actualizar estado de la orden
      const updated = await this.prisma.order.update({
        where: { id },
        data: { 
          status: 'CANCELLED' as any, // Usar CANCELLED en lugar de RELEASED
          updatedAt: new Date() 
        },
        include: { raffle: true, user: true },
      });

      // 4. Si estaba PAID, devolver boletos al inventario
      if (order.status === 'PAID') {
        await this.prisma.raffle.update({
          where: { id: order.raffleId },
          data: { sold: { decrement: order.tickets.length } },
        });
      }

      console.log('✅ Orden liberada exitosamente');

      // 5. Retornar con formato correcto
      return {
        ...updated,
        customer: {
          id: updated.user.id,
          name: updated.user.name || 'Sin nombre',
          phone: updated.user.phone || 'Sin teléfono',
          email: updated.user.email || '',
          district: updated.user.district || 'Sin distrito',
        },
        raffleTitle: updated.raffle.title,
        total: updated.total,
      };
    } catch (error) {
      console.error('❌ Error en releaseOrder:', error);
      throw new HttpException(
        error.message || 'Error al liberar la orden',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async deleteOrder(id: string) {
    try {
      const order = await this.prisma.order.findUnique({ where: { id } });
      if (!order) {
        throw new NotFoundException('Order not found');
      }

      // Si la orden está completada, ajustar el conteo de boletos vendidos
      if (order.status === 'PAID') {
        await this.prisma.raffle.update({
          where: { id: order.raffleId },
          data: { sold: { decrement: order.tickets.length } },
        });
      }

      await this.prisma.order.delete({ where: { id } });
      return { message: 'Orden eliminada exitosamente' };
    } catch (error) {
      console.error('Error deleting order:', error);
      throw error;
    }
  }

  // Raffles
  async getAllRaffles(limit: number = 50) {
    return this.prisma.raffle.findMany({ 
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getFinishedRaffles() {
    const now = new Date();
    // Buscar rifas que estén finalizadas por estado O que ya hayan pasado la fecha de sorteo
    return this.prisma.raffle.findMany({ 
      where: { 
        OR: [
          { status: 'finished' },
          { drawDate: { lte: now }, status: { not: 'draft' } }
        ]
      },
      orderBy: { drawDate: 'desc' }
    });
  }
  
  async createRaffle(data: Omit<Raffle, 'id' | 'sold' | 'createdAt' | 'updatedAt'>) {
    try {
      // Validar campos requeridos
      if (!data.title || data.title.trim() === '') {
        throw new Error('El título es requerido');
      }
      if (!data.tickets || data.tickets < 1) {
        throw new Error('El número de boletos debe ser mayor a 0');
      }
      if (!data.price || data.price <= 0) {
        throw new Error('El precio debe ser mayor a 0');
      }
      if (!data.drawDate) {
        throw new Error('La fecha del sorteo es requerida');
      }

      // Generar slug automático si no existe
      const autoSlug = data.slug || data.title
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Quitar acentos
        .replace(/[^a-z0-9]+/g, '-') // Reemplazar caracteres especiales con guiones
        .replace(/^-+|-+$/g, '') // Quitar guiones del inicio/final
        .substring(0, 50) + '-' + Date.now().toString().slice(-6); // Agregar timestamp para unicidad
      
      // Imagen por defecto si no se proporciona
      const defaultImage = 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=800&h=600&fit=crop';
      
      // Filtrar solo los campos que existen en el esquema de Prisma
      const raffleData = {
        title: data.title.trim(),
        description: data.description || null,
        imageUrl: data.imageUrl || defaultImage,
        gallery: data.gallery || null,
        price: Number(data.price),
        tickets: Number(data.tickets),
        sold: 0,
        drawDate: new Date(data.drawDate),
        status: data.status || 'draft',
        slug: autoSlug,
        boletosConOportunidades: data.boletosConOportunidades || false,
        numeroOportunidades: data.numeroOportunidades || 1,
      };

      console.log('📝 Creating raffle with data:', raffleData);
      
      const createdRaffle = await this.prisma.raffle.create({ 
        data: raffleData 
      });
      
      console.log('✅ Raffle created successfully:', createdRaffle.id);
      return createdRaffle;
    } catch (error) {
      console.error('❌ Error creating raffle:', error);
      if (error instanceof Error) {
        throw new Error(`Error al crear la rifa: ${error.message}`);
      }
      throw new Error('Error desconocido al crear la rifa');
    }
  }

  async updateRaffle(id: string, data: Raffle) {
    try {
      // Verificar que la rifa existe
      const existingRaffle = await this.prisma.raffle.findUnique({ 
        where: { id },
        include: { orders: true }
      });
      
      if (!existingRaffle) {
        throw new Error('Rifa no encontrada');
      }

      // Verificar si tiene boletos vendidos
      const hasSoldTickets = existingRaffle.sold > 0;
      const hasPaidOrders = existingRaffle.orders.some(order => order.status === 'PAID');

      console.log('📝 Updating raffle:', id, 'hasSoldTickets:', hasSoldTickets, 'hasPaidOrders:', hasPaidOrders);

      // Filtrar campos según reglas de negocio
      const raffleData: any = {};
      
      // Campos siempre editables
      if (data.title !== undefined) {
        if (!data.title.trim()) {
          throw new Error('El título es requerido');
        }
        raffleData.title = data.title.trim();
      }
      
      if (data.description !== undefined) {
        raffleData.description = data.description;
      }
      
      if (data.imageUrl !== undefined) {
        raffleData.imageUrl = data.imageUrl;
      }
      
      if (data.gallery !== undefined) {
        raffleData.gallery = data.gallery;
      }
      
      if (data.drawDate !== undefined) {
        raffleData.drawDate = new Date(data.drawDate);
      }
      
      if (data.status !== undefined) {
        raffleData.status = data.status;
      }
      
      if (data.slug !== undefined) {
        raffleData.slug = data.slug;
      }

      if (data.boletosConOportunidades !== undefined) {
        raffleData.boletosConOportunidades = data.boletosConOportunidades;
      }

      if (data.numeroOportunidades !== undefined) {
        if (data.numeroOportunidades < 1 || data.numeroOportunidades > 10) {
          throw new Error('El número de oportunidades debe estar entre 1 y 10');
        }
        raffleData.numeroOportunidades = Number(data.numeroOportunidades);
      }

      // Campos editables solo si NO tiene boletos vendidos/pagados
      if (hasSoldTickets || hasPaidOrders) {
        console.log('⚠️ Rifa tiene boletos vendidos/pagados - limitando edición');
        
        // Solo rechazar cambios si el valor REALMENTE cambió
        if (data.price !== undefined && data.price !== existingRaffle.price) {
          console.log(`❌ Intento de cambiar precio: ${existingRaffle.price} -> ${data.price}`);
          throw new Error('No se puede cambiar el precio cuando ya hay boletos vendidos');
        }
        
        if (data.tickets !== undefined && data.tickets !== existingRaffle.tickets) {
          console.log(`❌ Intento de cambiar boletos: ${existingRaffle.tickets} -> ${data.tickets}`);
          throw new Error('No se puede cambiar el número total de boletos cuando ya hay boletos vendidos');
        }
        
        // Si los valores son iguales, simplemente no agregarlos al objeto de actualización
        if (data.price !== undefined && data.price === existingRaffle.price) {
          console.log('✅ Precio no cambió, omitiendo del update');
        }
        if (data.tickets !== undefined && data.tickets === existingRaffle.tickets) {
          console.log('✅ Número de boletos no cambió, omitiendo del update');
        }
      } else {
        // Sin boletos vendidos - permitir editar todo
        if (data.price !== undefined) {
          if (data.price <= 0) {
            throw new Error('El precio debe ser mayor a 0');
          }
          raffleData.price = Number(data.price);
        }
        
        if (data.tickets !== undefined) {
          if (data.tickets < 1) {
            throw new Error('El número de boletos debe ser mayor a 0');
          }
          raffleData.tickets = Number(data.tickets);
        }
      }
      
      console.log('📝 Final update data:', raffleData);
      
      const updatedRaffle = await this.prisma.raffle.update({ 
        where: { id }, 
        data: raffleData 
      });
      
      console.log('✅ Raffle updated successfully');
      return updatedRaffle;
    } catch (error) {
      console.error('❌ Error updating raffle:', error);
      if (error instanceof Error) {
        throw new Error(`Error al actualizar la rifa: ${error.message}`);
      }
      throw new Error('Error desconocido al actualizar la rifa');
    }
  }

  async deleteRaffle(id: string) {
    try {
      // Verificar que la rifa existe
      const existingRaffle = await this.prisma.raffle.findUnique({ 
        where: { id },
        include: { orders: true }
      });
      
      if (!existingRaffle) {
        throw new Error('Rifa no encontrada');
      }

      // Verificar si tiene órdenes asociadas
      if (existingRaffle.orders && existingRaffle.orders.length > 0) {
        const hasPaidOrders = existingRaffle.orders.some(order => order.status === 'PAID');
        if (hasPaidOrders) {
          throw new Error('No se puede eliminar una rifa con órdenes pagadas');
        }
      }

      console.log('🗑️ Deleting raffle:', id);
      
      // Eliminar la rifa
      await this.prisma.raffle.delete({ where: { id } });
      
      console.log('✅ Raffle deleted successfully');
      return { message: 'Rifa eliminada exitosamente' };
    } catch (error) {
      console.error('❌ Error deleting raffle:', error);
      if (error instanceof Error) {
        throw new Error(`Error al eliminar la rifa: ${error.message}`);
      }
      throw new Error('Error desconocido al eliminar la rifa');
    }
  }

  async downloadTickets(raffleId: string, tipo: 'apartados' | 'pagados', formato: 'csv' | 'excel'): Promise<{ filename: string; content: string; contentType: string }> {
    try {
      console.log('📥 Downloading tickets:', { raffleId, tipo, formato });

      // Verificar que la rifa existe
      const raffle = await this.prisma.raffle.findUnique({ 
        where: { id: raffleId },
        select: { id: true, title: true }
      });
      
      if (!raffle) {
        throw new Error('Rifa no encontrada');
      }

      // Obtener órdenes según el tipo
      const statusFilter = tipo === 'apartados' ? 'PENDING' : 'PAID';
      const orders = await this.prisma.order.findMany({
        where: { 
          raffleId,
          status: statusFilter
        },
        include: {
          user: true,
          raffle: true
        },
        orderBy: { createdAt: 'desc' }
      });

      console.log(`📊 Found ${orders.length} orders with status ${statusFilter}`);

      // Preparar datos para exportación con información completa
      const exportData = [];
      for (const order of orders) {
        const totalBoletos = order.tickets.length;
        const montoPorBoleto = order.total / totalBoletos;
        
        for (const ticketNumber of order.tickets) {
          exportData.push({
            numero_boleto: ticketNumber,
            cliente: order.user.name || 'Sin nombre',
            telefono: order.user.phone || 'Sin teléfono',
            distrito: order.user.district || 'No especificado',
            fecha_apartado: this.formatDate(order.createdAt),
            fecha_pago: tipo === 'pagados' ? this.formatDate(order.updatedAt) : 'Pendiente',
            metodo_pago: order.paymentMethod || 'No especificado',
            monto_total: order.total,
            monto_boleto: montoPorBoleto,
            folio: order.folio,
            expira: this.formatDate(order.expiresAt),
            notas: order.notes || 'Sin notas',
            estado: order.status
          });
        }
      }

      if (exportData.length === 0) {
        throw new Error(`No hay boletos ${tipo} para esta rifa`);
      }

      // Generar archivo según formato
      if (formato === 'csv') {
        return this.generateCSV(exportData, raffle.title, tipo);
      } else {
        return this.generateExcel(exportData, raffle.title, tipo);
      }

    } catch (error) {
      console.error('❌ Error downloading tickets:', error);
      throw error;
    }
  }

  private formatDate(date: Date): string {
    return date.toLocaleString('es-HN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private generateCSV(data: any[], raffleTitle: string, tipo: string) {
    // UTF-8 BOM para mejor compatibilidad con Excel
    const BOM = '\uFEFF';
    const headers = [
      'Número Boleto',
      'Cliente', 
      'Teléfono',
      'Distrito',
      'Fecha Apartado',
      'Fecha Pago',
      'Método Pago',
      'Monto Total',
      'Monto por Boleto',
      'Folio',
      'Fecha Expira',
      'Notas',
      'Estado'
    ];

    const csvContent = BOM + [
      headers.join(','),
      ...data.map(row => [
        row.numero_boleto,
        `"${(row.cliente || '').replace(/"/g, '""')}"`,
        `"${(row.telefono || '').replace(/"/g, '""')}"`,
        `"${(row.distrito || '').replace(/"/g, '""')}"`,
        `"${row.fecha_apartado}"`,
        `"${row.fecha_pago}"`,
        `"${(row.metodo_pago || '').replace(/"/g, '""')}"`,
        row.monto_total,
        row.monto_boleto,
        `"${row.folio}"`,
        `"${row.expira}"`,
        `"${(row.notas || '').replace(/"/g, '""')}"`,
        `"${row.estado}"`
      ].join(','))
    ].join('\n');

    const filename = `boletos-${tipo}-${raffleTitle.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
    
    return {
      filename,
      content: csvContent,
      contentType: 'text/csv'
    };
  }

  private generateExcel(data: any[], raffleTitle: string, tipo: string) {
    const XLSX = require('xlsx');
    
    // Crear workbook
    const wb = XLSX.utils.book_new();
    
    // Preparar datos para Excel
    const excelData = data.map(row => ({
      'Número Boleto': row.numero_boleto,
      'Cliente': row.cliente,
      'Teléfono': row.telefono,
      'Distrito': row.distrito,
      'Fecha Apartado': row.fecha_apartado,
      'Fecha Pago': row.fecha_pago,
      'Método Pago': row.metodo_pago,
      'Monto Total': row.monto_total,
      'Monto por Boleto': row.monto_boleto,
      'Folio': row.folio,
      'Fecha Expira': row.expira,
      'Notas': row.notas,
      'Estado': row.estado
    }));

    // Crear worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);
    
    // Ajustar ancho de columnas
    const colWidths = [
      { wch: 15 }, // Número Boleto
      { wch: 25 }, // Cliente
      { wch: 15 }, // Teléfono
      { wch: 20 }, // Distrito
      { wch: 18 }, // Fecha Apartado
      { wch: 18 }, // Fecha Pago
      { wch: 18 }, // Método Pago
      { wch: 14 }, // Monto Total
      { wch: 14 }, // Monto por Boleto
      { wch: 22 }, // Folio
      { wch: 18 }, // Fecha Expira
      { wch: 30 }, // Notas
      { wch: 12 }  // Estado
    ];
    ws['!cols'] = colWidths;

    // Agregar worksheet al workbook
    XLSX.utils.book_append_sheet(wb, ws, `Boletos ${tipo}`);
    
    // Generar buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    const filename = `boletos-${tipo}-${raffleTitle.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.xlsx`;
    
    return {
      filename,
      content: buffer.toString('base64'),
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
  }

  // Winners
  async getAllWinners() {
    return this.prisma.winner.findMany({ orderBy: { createdAt: 'desc' } });
  }
  
  async drawWinner(raffleId: string) {
    const paidOrders = await this.prisma.order.findMany({
        where: { raffleId, status: 'PAID' },
        include: { user: true }
    });
    
    if (paidOrders.length === 0) {
        throw new BadRequestException("No hay boletos pagados para este sorteo.");
    }
    
    const allPaidTickets = paidOrders.flatMap(o => o.tickets);
    if(allPaidTickets.length === 0) {
        throw new BadRequestException("No hay boletos pagados para este sorteo.");
    }

    const winningTicket = allPaidTickets[Math.floor(Math.random() * allPaidTickets.length)];
    const winningOrder = paidOrders.find(o => o.tickets.includes(winningTicket));

    if (!winningOrder) {
         throw new Error("Error interno al encontrar al ganador.");
    }

    // Formatear la orden con los datos del usuario como customer
    const formattedOrder = {
        ...winningOrder,
        customer: winningOrder.user ? {
            id: winningOrder.user.id,
            name: winningOrder.user.name || 'Sin nombre',
            phone: winningOrder.user.phone || 'Sin teléfono',
            email: winningOrder.user.email || '',
            district: winningOrder.user.district || 'Sin distrito'
        } : null
    };

    return { ticket: winningTicket, order: formattedOrder };
  }

  async saveWinner(data: Omit<Winner, 'id' | 'createdAt' | 'updatedAt'>) {
    console.log('💾 Saving winner with data:', data);
    
    // Validar que el campo 'name' existe y no está vacío
    if (!data.name || data.name.trim() === '') {
      throw new BadRequestException('El campo "name" es requerido para guardar un ganador');
    }
    
    const winnerData = {
      name: data.name.trim(),
      prize: data.prize,
      imageUrl: data.imageUrl,
      raffleTitle: data.raffleTitle,
      drawDate: data.drawDate,
      ticketNumber: data.ticketNumber || null,
      testimonial: data.testimonial || null,
      phone: data.phone || null,
      city: data.city || null,
    };
    
    console.log('💾 Winner data to create:', winnerData);
    
    try {
      const result = await this.prisma.winner.create({ data: winnerData });
      console.log('✅ Winner created successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Error creating winner:', error);
      throw error;
    }
  }

  async deleteWinner(id: string) {
    return this.prisma.winner.delete({ where: { id } });
  }

  // Users
  async getUsers() {
    return this.prisma.adminUser.findMany();
  }

  async createUser(data: Prisma.AdminUserCreateInput) {
    try {
      // Validate required fields
      if (!data.username || !data.name || !data.password) {
        throw new Error('Username, name, and password are required');
      }
      
      return this.prisma.adminUser.create({ data });
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: string, data: Prisma.AdminUserUpdateInput) {
    return this.prisma.adminUser.update({ where: { id }, data });
  }

  async deleteUser(id: string) {
    return this.prisma.adminUser.delete({ where: { id } });
  }

  // Settings
  async updateSettings(data: any) {
    try {
      console.log('🔧 Updating settings with data:', data);
      
      const { 
        appearance, 
        contactInfo, 
        socialLinks, 
        paymentAccounts, 
        faqs 
      } = data;
      
      // Extract appearance data
      const appearanceData = appearance || {};
      const contactData = contactInfo || {};
      const socialData = socialLinks || {};
      
      const settingsData = {
        siteName: appearanceData.siteName || 'Lucky Snap',
        
        // Appearance settings
        logo: appearanceData.logo || null,
        favicon: appearanceData.favicon || null,
        logoAnimation: appearanceData.logoAnimation || 'rotate',
        primaryColor: appearanceData.colors?.backgroundPrimary || '#111827',
        secondaryColor: appearanceData.colors?.backgroundSecondary || '#1f2937',
        accentColor: appearanceData.colors?.accent || '#ec4899',
        actionColor: appearanceData.colors?.action || '#0ea5e9',
        
        // Contact info
        whatsapp: contactData.whatsapp || null,
        email: contactData.email || null,
        
        // Social links
        facebookUrl: socialData.facebookUrl || null,
        instagramUrl: socialData.instagramUrl || null,
        twitterUrl: socialData.twitterUrl || null,
        
        // Other settings - Ensure proper serialization
        paymentAccounts: this.safeStringify(paymentAccounts),
        faqs: this.safeStringify(faqs),
      };
      
      console.log('🔧 Settings data to save:', settingsData);
      
      const result = await this.prisma.settings.upsert({
        where: { id: 'main_settings' },
        update: settingsData,
        create: {
          id: 'main_settings',
          ...settingsData,
        },
      });
      
      console.log('✅ Settings updated successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Error updating settings:', error);
      throw new Error('Failed to update settings');
    }
  }

  private safeStringify(data: any): string {
    try {
      if (!data) return JSON.stringify([]);
      
      // If it's already a string, check if it's valid JSON
      if (typeof data === 'string') {
        try {
          JSON.parse(data);
          return data; // It's already valid JSON string
        } catch {
          return JSON.stringify([]); // Invalid JSON string, return empty array
        }
      }
      
      // If it's an object/array, stringify it
      return JSON.stringify(data);
    } catch (error) {
      console.error('❌ Error in safeStringify:', error);
      return JSON.stringify([]);
    }
  }
}
