import { Controller, Get, Post, Patch, Put, Delete, Body, Param, Query, HttpException, HttpStatus } from '@nestjs/common';
import { AdminService } from './admin.service';
// FIX: Using `import type` for types/namespaces and value import for the enum to fix module resolution.
import { type Raffle, type Winner, type Prisma } from '@prisma/client';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // Dashboard
  @Get('stats')
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  // Orders
  @Get('orders')
  async getAllOrders(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('raffleId') raffleId?: string,
  ) {
    try {
      const pageNum = page ? parseInt(page, 10) : 1;
      const limitNum = limit ? Math.min(parseInt(limit, 10), 100) : 50; // Máximo 100
      
      const result = await this.adminService.getAllOrders(pageNum, limitNum, status, raffleId);
      return result;
    } catch (error) {
      console.error('Error getting orders:', error);
      throw new HttpException('Error al obtener las órdenes', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  
  @Get('orders/:id')
  async getOrderById(@Param('id') id: string) {
    try {
      return await this.adminService.getOrderById(id);
    } catch (error) {
      console.error('Error getting order:', error);
      throw new HttpException('Error al obtener la orden', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  
  @Patch('orders/:folio/status')
  updateOrderStatus(@Param('folio') folio: string, @Body('status') status: string) {
    return this.adminService.updateOrderStatus(folio, status);
  }

  @Patch('orders/:id')
  async updateOrder(@Param('id') id: string, @Body() orderData: any) {
    try {
      const order = await this.adminService.updateOrder(id, orderData);
      return order;
    } catch (error) {
      console.error('Error updating order:', error);
      throw new HttpException('Error al actualizar la orden', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put('orders/:id/mark-paid')
  async markOrderPaid(@Param('id') id: string) {
    try {
      return await this.adminService.markOrderPaid(id);
    } catch (error) {
      console.error('Error marking order as paid:', error);
      throw new HttpException('Error al marcar la orden como pagada', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put('orders/:id/edit')
  async editOrder(
    @Param('id') id: string,
    @Body() body: { customer?: any; tickets?: number[]; notes?: string }
  ) {
    try {
      return await this.adminService.editOrder(id, body);
    } catch (error) {
      console.error('Error editing order:', error);
      throw new HttpException('Error al editar la orden', HttpStatus.BAD_REQUEST);
    }
  }

  @Put('orders/:id/release')
  async releaseOrder(@Param('id') id: string) {
    try {
      return await this.adminService.releaseOrder(id);
    } catch (error) {
      console.error('Error releasing order:', error);
      throw new HttpException('Error al liberar la orden', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete('orders/:id')
  async deleteOrder(@Param('id') id: string) {
    try {
      await this.adminService.deleteOrder(id);
      return { message: 'Orden eliminada exitosamente' };
    } catch (error) {
      console.error('Error deleting order:', error);
      throw new HttpException('Error al eliminar la orden', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Raffles
  @Get('raffles')
  getAllRaffles(@Query('limit') limit?: string) {
    const limitNum = limit ? Math.min(parseInt(limit, 10), 100) : 50; // Máximo 100
    return this.adminService.getAllRaffles(limitNum);
  }
  
  @Get('raffles/finished')
  getFinishedRaffles() {
    return this.adminService.getFinishedRaffles();
  }

  @Post('raffles')
  async createRaffle(@Body() data: Omit<Raffle, 'id' | 'sold' | 'createdAt' | 'updatedAt'>) {
    try {
      const raffle = await this.adminService.createRaffle(data);
      return {
        success: true,
        message: 'Rifa creada exitosamente',
        data: raffle
      };
    } catch (error) {
      console.error('❌ Error in createRaffle controller:', error);
      throw new HttpException(
        error instanceof Error ? error.message : 'Error al crear la rifa',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Patch('raffles/:id')
  async updateRaffle(@Param('id') id: string, @Body() data: Raffle) {
    try {
      const raffle = await this.adminService.updateRaffle(id, data);
      return {
        success: true,
        message: 'Rifa actualizada exitosamente',
        data: raffle
      };
    } catch (error) {
      console.error('❌ Error in updateRaffle controller:', error);
      throw new HttpException(
        error instanceof Error ? error.message : 'Error al actualizar la rifa',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Delete('raffles/:id')
  deleteRaffle(@Param('id') id: string) {
    return this.adminService.deleteRaffle(id);
  }
  
  // Winners
  @Get('winners')
  getAllWinners() {
    return this.adminService.getAllWinners();
  }
  
  @Post('winners/draw')
  drawWinner(@Body('raffleId') raffleId: string) {
    return this.adminService.drawWinner(raffleId);
  }

  @Post('winners')
  saveWinner(@Body() data: Omit<Winner, 'id' | 'createdAt' | 'updatedAt'>) {
    return this.adminService.saveWinner(data);
  }

  @Delete('winners/:id')
  deleteWinner(@Param('id') id: string) {
    return this.adminService.deleteWinner(id);
  }

  // Users
  @Get('users')
  getUsers() {
    return this.adminService.getUsers();
  }
  
  @Post('users')
  createUser(@Body() data: Prisma.AdminUserCreateInput) {
    return this.adminService.createUser(data);
  }
  
  @Patch('users/:id')
  updateUser(@Param('id') id: string, @Body() data: Prisma.AdminUserUpdateInput) {
    return this.adminService.updateUser(id, data);
  }
  
  @Delete('users/:id')
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }
  
  // Settings
  @Post('settings')
  updateSettings(@Body() data: any) {
    return this.adminService.updateSettings(data);
  }
}
