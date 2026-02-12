
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { PublicModule } from './public/public.module';
import { AdminModule } from './admin/admin.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { MetaModule } from './meta/meta.module';
import { TrackingModule } from './tracking/tracking.module';
import { UploadModule } from './upload/upload.module';
import { PaymentModule } from './payment/payment.module';
import { InitController } from './init.controller';
import { InitDatabaseService } from './init-database';

@Module({
  imports: [
    PrismaModule, 
    PublicModule, 
    AdminModule, 
    AnalyticsModule, 
    MetaModule, 
    TrackingModule,
    UploadModule,
    PaymentModule
  ],
  controllers: [AppController, InitController],
  providers: [AppService, InitDatabaseService],
})
export class AppModule {}
