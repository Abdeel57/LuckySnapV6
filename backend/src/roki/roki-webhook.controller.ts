import { Controller, HttpCode, InternalServerErrorException, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { RokiPaymentsService } from './roki-payments.service';

/**
 * POST /api/payments/roki/webhook
 * main.ts monta express.raw() en esta ruta para que req.body sea el Buffer exacto
 * que firmó ROKI. Respondemos 200 en cuanto el evento queda guardado y lo
 * procesamos después; ROKI reintenta (hasta 5 veces) si no recibe 2xx.
 */
@Controller('payments')
export class RokiWebhookController {
  constructor(private readonly payments: RokiPaymentsService) {}

  @Post('roki/webhook')
  @HttpCode(200)
  async handleWebhook(@Req() req: Request) {
    const raw = req.body;
    if (!Buffer.isBuffer(raw)) {
      console.error('❌ [ROKI] El webhook no recibió el cuerpo crudo (revisar express.raw en main.ts)');
      throw new InternalServerErrorException('Raw body no disponible');
    }

    const headers: Record<string, string | string[] | undefined> = {};
    for (const [key, value] of Object.entries(req.headers)) headers[key.toLowerCase()] = value as string | string[] | undefined;

    const outcome = await this.payments.receiveWebhook(raw, headers);
    if (outcome.eventRowId) {
      const eventRowId = outcome.eventRowId;
      setImmediate(() => {
        this.payments.processEvent(eventRowId).catch((error) => console.error(`❌ [ROKI] Error procesando evento ${eventRowId}:`, error));
      });
    }
    return { received: true, duplicate: outcome.duplicate };
  }
}
