import { BadRequestException, Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { RokiPaymentsService } from './roki-payments.service';

/** Panel: diagnóstico, intentos de pago, incidencias y acciones manuales. */
@Controller('admin/payments/roki')
export class RokiAdminController {
  constructor(private readonly payments: RokiPaymentsService) {}

  @Get('diagnostics')
  diagnostics() {
    return this.payments.diagnostics();
  }

  @Get('payments')
  list(@Query('status') status?: string, @Query('environment') environment?: string, @Query('limit') limit?: string, @Query('folio') folio?: string) {
    const parsed = limit ? Number.parseInt(limit, 10) : undefined;
    return this.payments.listPayments({ status: status || undefined, environment: environment || undefined, limit: Number.isFinite(parsed as number) ? parsed : undefined, folio: folio || undefined });
  }

  @Get('payments/:id')
  detail(@Param('id') id: string) {
    return this.payments.getPaymentForAdmin(id);
  }

  @Get('incidents')
  incidents() {
    return this.payments.listIncidents();
  }

  @Post('reconcile')
  reconcile() {
    return this.payments.reconcile(100);
  }

  @Post('payments/:id/sync')
  sync(@Param('id') id: string) {
    return this.payments.syncPayment(id, { source: 'admin:sync' });
  }

  @Post('payments/:id/resolve')
  resolve(@Param('id') id: string, @Body() body: { action?: string; note?: string }) {
    const action = body?.action;
    if (action !== 'confirm' && action !== 'dismiss') throw new BadRequestException('action debe ser confirm o dismiss');
    return this.payments.resolveIncident(id, action, typeof body?.note === 'string' ? body.note : undefined);
  }

  @Post('webhook-test')
  webhookTest() {
    return this.payments.sendWebhookTest();
  }
}
