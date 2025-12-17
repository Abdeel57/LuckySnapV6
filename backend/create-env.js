// Script para crear el archivo .env
const fs = require('fs');
const path = require('path');

const envContent = `# Lucky Snap - Backend Environment Variables
# Configuración para migración a PostgreSQL

# Database Configuration - TU URL DE RAILWAY
DATABASE_URL=postgresql://postgres:ZuCkGpLHcIJynmWvsMEqzIzypbuXotKm@nozomi.proxy.rlwy.net:50670/railway

# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Secret for authentication
JWT_SECRET=lucky_snap_jwt_secret_2024_change_in_production
`;

const envPath = path.join(__dirname, '.env');

try {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Archivo .env creado exitosamente');
    console.log('📍 Ubicación:', envPath);
} catch (error) {
    console.error('❌ Error creando .env:', error);
}

