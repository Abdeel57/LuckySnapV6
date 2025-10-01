// Script para hacer respaldo de datos JSON antes de la migración
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const BACKUP_DIR = path.join(__dirname, 'backup');

// Archivos a respaldar
const FILES_TO_BACKUP = [
    'raffles.json',
    'settings.json', 
    'users.json',
    'orders.json',
    'winners.json'
];

function createBackup() {
    console.log('💾 Creando respaldo de datos JSON...');
    
    try {
        // Crear directorio de respaldo si no existe
        if (!fs.existsSync(BACKUP_DIR)) {
            fs.mkdirSync(BACKUP_DIR, { recursive: true });
        }
        
        // Crear directorio con timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupTimestampDir = path.join(BACKUP_DIR, `backup-${timestamp}`);
        fs.mkdirSync(backupTimestampDir, { recursive: true });
        
        let backedUpFiles = 0;
        
        // Respaldar cada archivo
        for (const filename of FILES_TO_BACKUP) {
            const sourceFile = path.join(DATA_DIR, filename);
            const backupFile = path.join(backupTimestampDir, filename);
            
            if (fs.existsSync(sourceFile)) {
                fs.copyFileSync(sourceFile, backupFile);
                console.log(`✅ Respaldado: ${filename}`);
                backedUpFiles++;
            } else {
                console.log(`⚠️  No encontrado: ${filename}`);
            }
        }
        
        // Crear archivo de información del respaldo
        const backupInfo = {
            timestamp: new Date().toISOString(),
            files: FILES_TO_BACKUP,
            backedUpCount: backedUpFiles,
            note: 'Respaldo automático antes de migración a PostgreSQL'
        };
        
        fs.writeFileSync(
            path.join(backupTimestampDir, 'backup-info.json'),
            JSON.stringify(backupInfo, null, 2)
        );
        
        console.log(`🎉 Respaldo completado:`);
        console.log(`   - Directorio: ${backupTimestampDir}`);
        console.log(`   - Archivos respaldados: ${backedUpFiles}/${FILES_TO_BACKUP.length}`);
        
        return backupTimestampDir;
        
    } catch (error) {
        console.error('❌ Error creando respaldo:', error);
        throw error;
    }
}

// Ejecutar respaldo si se llama directamente
if (require.main === module) {
    try {
        const backupDir = createBackup();
        console.log(`✅ Respaldo guardado en: ${backupDir}`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error en respaldo:', error);
        process.exit(1);
    }
}

module.exports = { createBackup };
