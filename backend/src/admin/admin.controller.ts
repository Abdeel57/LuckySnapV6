import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { AdminService } from './admin.service';
// FIX: Using `import type` for types/namespaces and value import for the enum to fix module resolution.
import { OrderStatus, type Raffle, type Winner, type Prisma } from '@prisma/client';

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
  getAllOrders() {
    return this.adminService.getAllOrders();
  }
  
  @Patch('orders/:folio/status')
  updateOrderStatus(@Param('folio') folio: string, @Body('status') status: OrderStatus) {
    return this.adminService.updateOrderStatus(folio, status);
  }

  // Raffles
  @Get('raffles')
  getAllRaffles() {
    return this.adminService.getAllRaffles();
  }
  
  @Get('raffles/finished')
  getFinishedRaffles() {
    return this.adminService.getFinishedRaffles();
  }

  @Post('raffles')
  createRaffle(@Body() data: Omit<Raffle, 'id' | 'sold' | 'createdAt' | 'updatedAt'>) {
    return this.adminService.createRaffle(data);
  }

  @Patch('raffles/:id')
  updateRaffle(@Param('id') id: string, @Body() data: Raffle) {
    return this.adminService.updateRaffle(id, data);
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
