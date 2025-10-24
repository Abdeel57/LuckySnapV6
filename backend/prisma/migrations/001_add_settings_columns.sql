-- CreateTable
CREATE TABLE IF NOT EXISTS "settings" (
    "id" TEXT NOT NULL,
    "siteName" TEXT NOT NULL DEFAULT 'Lucky Snap',
    "logo" TEXT,
    "favicon" TEXT,
    "logoAnimation" TEXT NOT NULL DEFAULT 'rotate',
    "primaryColor" TEXT NOT NULL DEFAULT '#111827',
    "secondaryColor" TEXT NOT NULL DEFAULT '#1f2937',
    "accentColor" TEXT NOT NULL DEFAULT '#ec4899',
    "actionColor" TEXT NOT NULL DEFAULT '#0ea5e9',
    "whatsapp" TEXT,
    "email" TEXT,
    "facebookUrl" TEXT,
    "instagramUrl" TEXT,
    "twitterUrl" TEXT,
    "paymentAccounts" JSONB,
    "faqs" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- Add columns to existing table if they don't exist
DO $$ 
BEGIN
    -- Add logo column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'logo') THEN
        ALTER TABLE "settings" ADD COLUMN "logo" TEXT;
    END IF;
    
    -- Add favicon column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'favicon') THEN
        ALTER TABLE "settings" ADD COLUMN "favicon" TEXT;
    END IF;
    
    -- Add logoAnimation column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'logoAnimation') THEN
        ALTER TABLE "settings" ADD COLUMN "logoAnimation" TEXT NOT NULL DEFAULT 'rotate';
    END IF;
    
    -- Add primaryColor column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'primaryColor') THEN
        ALTER TABLE "settings" ADD COLUMN "primaryColor" TEXT NOT NULL DEFAULT '#111827';
    END IF;
    
    -- Add secondaryColor column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'secondaryColor') THEN
        ALTER TABLE "settings" ADD COLUMN "secondaryColor" TEXT NOT NULL DEFAULT '#1f2937';
    END IF;
    
    -- Add accentColor column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'accentColor') THEN
        ALTER TABLE "settings" ADD COLUMN "accentColor" TEXT NOT NULL DEFAULT '#ec4899';
    END IF;
    
    -- Add actionColor column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'actionColor') THEN
        ALTER TABLE "settings" ADD COLUMN "actionColor" TEXT NOT NULL DEFAULT '#0ea5e9';
    END IF;
    
    -- Add whatsapp column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'whatsapp') THEN
        ALTER TABLE "settings" ADD COLUMN "whatsapp" TEXT;
    END IF;
    
    -- Add email column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'email') THEN
        ALTER TABLE "settings" ADD COLUMN "email" TEXT;
    END IF;
    
    -- Add facebookUrl column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'facebookUrl') THEN
        ALTER TABLE "settings" ADD COLUMN "facebookUrl" TEXT;
    END IF;
    
    -- Add instagramUrl column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'instagramUrl') THEN
        ALTER TABLE "settings" ADD COLUMN "instagramUrl" TEXT;
    END IF;
    
    -- Add twitterUrl column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'twitterUrl') THEN
        ALTER TABLE "settings" ADD COLUMN "twitterUrl" TEXT;
    END IF;
END $$;

-- Update existing records with default values
UPDATE "settings" SET 
    "logoAnimation" = COALESCE("logoAnimation", 'rotate'),
    "primaryColor" = COALESCE("primaryColor", '#111827'),
    "secondaryColor" = COALESCE("secondaryColor", '#1f2937'),
    "accentColor" = COALESCE("accentColor", '#ec4899'),
    "actionColor" = COALESCE("actionColor", '#0ea5e9')
WHERE "id" = 'main_settings';
