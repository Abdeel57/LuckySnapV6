/**
 * Script para aplicar la migración de packs y bonuses
 * Ejecuta: node apply-packs-bonuses-migration.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function applyMigration() {
    try {
        console.log('🔄 Aplicando migración de packs y bonuses...');
        
        // Verificar si las columnas ya existen
        const result = await prisma.$queryRaw`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'raffles' 
            AND column_name IN ('packs', 'bonuses')
        `;
        
        const existingColumns = result.map(r => r.column_name);
        
        if (!existingColumns.includes('packs')) {
            console.log('📦 Agregando columna packs...');
            await prisma.$executeRaw`
                ALTER TABLE raffles 
                ADD COLUMN packs JSONB
            `;
            console.log('✅ Columna packs agregada');
        } else {
            console.log('✅ Columna packs ya existe');
        }
        
        if (!existingColumns.includes('bonuses')) {
            console.log('🎁 Agregando columna bonuses...');
            await prisma.$executeRaw`
                ALTER TABLE raffles 
                ADD COLUMN bonuses TEXT[]
            `;
            console.log('✅ Columna bonuses agregada');
        } else {
            console.log('✅ Columna bonuses ya existe');
        }
        
        console.log('✨ Migración completada exitosamente!');
        
    } catch (error) {
        console.error('❌ Error aplicando migración:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

applyMigration()
    .then(() => {
        console.log('🎉 ¡Todo listo!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Error fatal:', error);
        process.exit(1);
    });

