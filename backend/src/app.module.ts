
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { PublicModule } from './public/public.module';
import { AdminModule } from './admin/admin.module';


@Module({
  imports: [PrismaModule, PublicModule, AdminModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
