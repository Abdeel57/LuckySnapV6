import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class InitDatabaseService {
  constructor(private prisma: PrismaService) {}

  async initializeDatabase() {
    try {
      console.log('🗄️ Inicializando base de datos...');
      
      // Crear las tablas usando SQL directo
      await this.prisma.$executeRaw`
        -- Create enum type for OrderStatus
        DO $$ BEGIN
          CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED', 'EXPIRED');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `;

      await this.prisma.$executeRaw`
        -- Create Users table
        CREATE TABLE IF NOT EXISTS "users" (
            "id" TEXT NOT NULL,
            "email" TEXT NOT NULL,
            "name" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "users_pkey" PRIMARY KEY ("id")
        );
      `;

      await this.prisma.$executeRaw`
        -- Create Raffles table
        CREATE TABLE IF NOT EXISTS "raffles" (
            "id" TEXT NOT NULL,
            "title" TEXT NOT NULL,
            "description" TEXT,
            "imageUrl" TEXT,
            "price" DOUBLE PRECISION NOT NULL,
            "totalTickets" INTEGER NOT NULL,
            "sold" INTEGER NOT NULL DEFAULT 0,
            "endDate" TIMESTAMP(3) NOT NULL,
            "isActive" BOOLEAN NOT NULL DEFAULT true,
            "status" TEXT NOT NULL DEFAULT 'active',
            "slug" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "raffles_pkey" PRIMARY KEY ("id")
        );
      `;

      await this.prisma.$executeRaw`
        -- Create Tickets table
        CREATE TABLE IF NOT EXISTS "tickets" (
            "id" TEXT NOT NULL,
            "raffleId" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "quantity" INTEGER NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
        );
      `;

      await this.prisma.$executeRaw`
        -- Create Orders table
        CREATE TABLE IF NOT EXISTS "orders" (
            "id" TEXT NOT NULL,
            "folio" TEXT NOT NULL,
            "raffleId" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "tickets" INTEGER[],
            "total" DOUBLE PRECISION NOT NULL,
            "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "expiresAt" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
        );
      `;

      await this.prisma.$executeRaw`
        -- Create Winners table
        CREATE TABLE IF NOT EXISTS "winners" (
            "id" TEXT NOT NULL,
            "raffleId" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "ticketId" TEXT NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "winners_pkey" PRIMARY KEY ("id")
        );
      `;

      await this.prisma.$executeRaw`
        -- Create AdminUsers table
        CREATE TABLE IF NOT EXISTS "admin_users" (
            "id" TEXT NOT NULL,
            "email" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "password" TEXT NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
        );
      `;

      await this.prisma.$executeRaw`
        -- Create Settings table
        CREATE TABLE IF NOT EXISTS "settings" (
            "id" TEXT NOT NULL,
            "siteName" TEXT NOT NULL DEFAULT 'Lucky Snap',
            "paymentAccounts" JSONB,
            "faqs" JSONB,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
        );
      `;

      // Crear índices únicos
      await this.prisma.$executeRaw`
        CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
      `;
      
      await this.prisma.$executeRaw`
        CREATE UNIQUE INDEX IF NOT EXISTS "raffles_slug_key" ON "raffles"("slug");
      `;
      
      await this.prisma.$executeRaw`
        CREATE UNIQUE INDEX IF NOT EXISTS "orders_folio_key" ON "orders"("folio");
      `;
      
      await this.prisma.$executeRaw`
        CREATE UNIQUE INDEX IF NOT EXISTS "admin_users_email_key" ON "admin_users"("email");
      `;

      console.log('✅ Base de datos inicializada exitosamente');
      return { success: true, message: 'Base de datos inicializada' };
      
    } catch (error) {
      console.error('❌ Error inicializando base de datos:', error);
      return { success: false, message: error.message };
    }
  }
}
