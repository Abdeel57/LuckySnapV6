import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PayPalService } from '../services/paypal.service';
import { AdminService } from '../admin/admin.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PaymentController],
  providers: [PayPalService, AdminService],
})
export class PaymentModule {}


