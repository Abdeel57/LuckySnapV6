import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { RokiConfigService } from './roki.config';
import { RokiPaymentsService } from './roki-payments.service';

/**
 * Conciliación periódica: recupera confirmaciones cuyo webhook no llegó,
 * detecta enlaces vencidos y pagos tardíos. El servicio de pagos ya impide
 * ejecuciones simultáneas; aquí solo se programa el ritmo.
 */
@Injectable()
export class RokiReconciliationService implements OnModuleInit, OnModuleDestroy {
  private timer: NodeJS.Timeout | null = null;
  private initialTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly configService: RokiConfigService,
    private readonly payments: RokiPaymentsService,
  ) {}

  onModuleInit() {
    const config = this.configService.config;
    if (!config.enabled) return;
    const everyMs = Math.max(30, config.reconcileIntervalSeconds) * 1000;
    console.log(`🔁 [ROKI] Conciliación cada ${Math.round(everyMs / 1000)} s`);
    this.initialTimer = setTimeout(() => this.run(), 20_000);
    this.timer = setInterval(() => this.run(), everyMs);
    this.initialTimer.unref?.();
    this.timer.unref?.();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
    if (this.initialTimer) clearTimeout(this.initialTimer);
  }

  async run() {
    try {
      const summary = await this.payments.reconcile();
      if (summary.skipped) return;
      if (summary.checked || summary.adopted || summary.eventsReprocessed) {
        console.log(`🔁 [ROKI] Conciliación: ${summary.checked} revisados · ${summary.confirmed} confirmados · ${summary.review} en revisión · ${summary.terminal} cerrados · ${summary.errors} errores`);
      }
    } catch (error) {
      console.error('❌ [ROKI] Conciliación falló:', error);
    }
  }
}
