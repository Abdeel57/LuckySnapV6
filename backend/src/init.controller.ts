import { Controller, Get, Post } from '@nestjs/common';
import { InitDatabaseService } from './init-database';

@Controller('init')
export class InitController {
  constructor(private initService: InitDatabaseService) {}

  @Get()
  async checkStatus() {
    return { message: 'Init endpoint available' };
  }

  @Post('database')
  async initializeDatabase() {
    return this.initService.initializeDatabase();
  }
}
