-- Add new fields to Winner model
ALTER TABLE "winners" ADD COLUMN IF NOT EXISTS "ticketNumber" INTEGER;
ALTER TABLE "winners" ADD COLUMN IF NOT EXISTS "testimonial" TEXT;
ALTER TABLE "winners" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "winners" ADD COLUMN IF NOT EXISTS "city" TEXT;

