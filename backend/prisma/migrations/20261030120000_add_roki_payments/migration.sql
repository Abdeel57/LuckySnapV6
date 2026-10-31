-- Pagos con pasarela (ROKI Connect): intentos de pago y bandeja de webhooks.
-- Idempotente (IF NOT EXISTS) porque el historial de migraciones de este
-- proyecto no refleja todas las tablas existentes.

-- CreateTable
CREATE TABLE IF NOT EXISTS "payments" (
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
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "payment_events" (
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
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "payments_idempotencyKey_key" ON "payments"("idempotencyKey");
CREATE UNIQUE INDEX IF NOT EXISTS "payments_provider_environment_providerPaymentId_key" ON "payments"("provider", "environment", "providerPaymentId");
CREATE INDEX IF NOT EXISTS "payments_orderId_idx" ON "payments"("orderId");
CREATE INDEX IF NOT EXISTS "payments_status_nextCheckAt_idx" ON "payments"("status", "nextCheckAt");
CREATE INDEX IF NOT EXISTS "payments_reviewReason_reviewResolvedAt_idx" ON "payments"("reviewReason", "reviewResolvedAt");
CREATE UNIQUE INDEX IF NOT EXISTS "payment_events_provider_environment_eventId_key" ON "payment_events"("provider", "environment", "eventId");
CREATE INDEX IF NOT EXISTS "payment_events_status_receivedAt_idx" ON "payment_events"("status", "receivedAt");

-- AddForeignKey (solo si no existe)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payments_orderId_fkey') THEN
        ALTER TABLE "payments" ADD CONSTRAINT "payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payment_events_paymentId_fkey') THEN
        ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
