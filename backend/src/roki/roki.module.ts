import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminModule } from '../admin/admin.module';
import { RokiConfigService } from './roki.config';
import { RokiClient } from './roki.client';
import { RokiPaymentsService } from './roki-payments.service';
import { RokiReconciliationService } from './roki-reconciliation.service';
import { RokiPublicController } from './roki-public.controller';
import { RokiWebhookController } from './roki-webhook.controller';
import { RokiAdminController } from './roki-admin.controller';

@Module({
  imports: [PrismaModule, AdminModule],
  controllers: [RokiPublicController, RokiWebhookController, RokiAdminController],
  providers: [RokiConfigService, RokiClient, RokiPaymentsService, RokiReconciliationService],
  exports: [RokiPaymentsService],
})
export class RokiModule {}
