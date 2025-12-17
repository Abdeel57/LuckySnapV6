-- Migration script to add new columns to Settings table
-- This script adds all the new configuration fields

-- Add new appearance columns
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "logo" TEXT;
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "favicon" TEXT;
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "logoAnimation" TEXT DEFAULT 'rotate';

-- Add new color columns
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "primaryColor" TEXT DEFAULT '#111827';
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "secondaryColor" TEXT DEFAULT '#1f2937';
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "accentColor" TEXT DEFAULT '#ec4899';
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "actionColor" TEXT DEFAULT '#0ea5e9';

-- Add contact info columns
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "whatsapp" TEXT;
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "email" TEXT;

-- Add social links columns
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "facebookUrl" TEXT;
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "instagramUrl" TEXT;
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "twitterUrl" TEXT;

-- Update existing records with default values
UPDATE "settings" SET 
    "logoAnimation" = 'rotate',
    "primaryColor" = '#111827',
    "secondaryColor" = '#1f2937',
    "accentColor" = '#ec4899',
    "actionColor" = '#0ea5e9'
WHERE "logoAnimation" IS NULL;

-- Verify the migration
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'settings' 
ORDER BY ordinal_position;
