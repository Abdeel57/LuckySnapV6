-- Fix para crear la tabla winners con los campos correctos
-- Primero eliminar la tabla si existe con estructura incorrecta
DROP TABLE IF EXISTS "winners" CASCADE;

-- Crear la tabla winners con los campos correctos
CREATE TABLE "winners" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "prize" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "raffleTitle" TEXT NOT NULL,
    "drawDate" TIMESTAMP(3) NOT NULL,
    "ticketNumber" INTEGER,
    "testimonial" TEXT,
    "phone" TEXT,
    "city" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "winners_pkey" PRIMARY KEY ("id")
);
