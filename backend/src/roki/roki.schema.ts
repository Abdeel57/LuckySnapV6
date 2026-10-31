import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Tablas de pagos con tarjeta (payments, payment_events).
 *
 * No van como migración de Prisma: en producción la tabla interna
 * "_prisma_migrations" no tiene la estructura estándar y `prisma migrate deploy`
 * falla al registrar cualquier migración nueva (build de Railway del 2026-10-30).
 * Igual que InitDatabaseService, se crean al arrancar con SQL idempotente.
 * La definición coincide exactamente con schema.prisma (verificado con
 * `prisma migrate diff`): si se cambia el modelo, actualizar aquí también.
 */
export const ROKI_SCHEMA_STATEMENTS: readonly string[] = [
  `CREATE TABLE IF NOT EXISTS "payments" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'roki',
    "environment" TEXT NOT NULL,
    "merchantId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "providerPaymentId" INTEGER,
    "transactionId" TEXT,
    "externalReference" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "amountExpected" DOUBLE PRECISION NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "currencyIso" TEXT NOT NULL,
    "amountConfirmed" DOUBLE PRECISION,
    "checkoutUrl" TEXT,
    "requestSnapshot" JSONB NOT NULL,
    "providerSnapshot" JSONB,
    "expiresAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "lastCheckedAt" TIMESTAMP(3),
    "nextCheckAt" TIMESTAMP(3),
    "checkCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "reviewReason" TEXT,
    "reviewDetails" JSONB,
    "reviewResolvedAt" TIMESTAMP(3),
    "reviewResolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "payment_events" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'roki',
    "environment" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "providerPaymentId" INTEGER,
    "paymentId" TEXT,
    "rawBody" TEXT NOT NULL,
    "headers" JSONB,
    "status" TEXT NOT NULL DEFAULT 'received',
    "error" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    CONSTRAINT "payment_events_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "payments_idempotencyKey_key" ON "payments"("idempotencyKey")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "payments_provider_environment_providerPaymentId_key" ON "payments"("provider", "environment", "providerPaymentId")`,
  `CREATE INDEX IF NOT EXISTS "payments_orderId_idx" ON "payments"("orderId")`,
  `CREATE INDEX IF NOT EXISTS "payments_status_nextCheckAt_idx" ON "payments"("status", "nextCheckAt")`,
  `CREATE INDEX IF NOT EXISTS "payments_reviewReason_reviewResolvedAt_idx" ON "payments"("reviewReason", "reviewResolvedAt")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "payment_events_provider_environment_eventId_key" ON "payment_events"("provider", "environment", "eventId")`,
  `CREATE INDEX IF NOT EXISTS "payment_events_status_receivedAt_idx" ON "payment_events"("status", "receivedAt")`,
  `DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payments_orderId_fkey') THEN
      ALTER TABLE "payments" ADD CONSTRAINT "payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payment_events_paymentId_fkey') THEN
      ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
  END $$`,
];

/** Clave fija del candado: evita que dos instancias creen las tablas a la vez. */
const SCHEMA_LOCK_KEY = 734_021_908;

/** Crea las tablas si faltan. Idempotente; seguro de ejecutar en cada arranque. */
export async function ensureRokiSchema(prisma: Pick<PrismaService, '$transaction'>): Promise<void> {
  await prisma.$transaction(
    async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL lock_timeout = '10s'`);
      await tx.$executeRawUnsafe(`SET LOCAL statement_timeout = '30s'`);
      await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(${SCHEMA_LOCK_KEY})`);
      for (const statement of ROKI_SCHEMA_STATEMENTS) {
        await tx.$executeRawUnsafe(statement);
      }
    },
    { timeout: 60_000, maxWait: 15_000 },
  );
}

@Injectable()
export class RokiSchemaService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    try {
      await ensureRokiSchema(this.prisma);
      console.log('🗄️ [ROKI] Tablas de pagos verificadas');
    } catch (error) {
      // No impedir el arranque de la tienda: sin tablas, ROKI falla y el liberador usa su respaldo
      console.error('❌ [ROKI] No se pudieron crear/verificar las tablas de pagos:', error instanceof Error ? error.message : error);
    }
  }
}
