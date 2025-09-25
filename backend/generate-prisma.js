const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Generando cliente de Prisma...');

try {
  // Crear el directorio prisma si no existe
  const prismaDir = path.join(__dirname, 'prisma');
  if (!fs.existsSync(prismaDir)) {
    fs.mkdirSync(prismaDir, { recursive: true });
  }

  // Copiar el schema a la ubicación esperada por Prisma
  const schemaSource = path.join(__dirname, 'schema.prisma');
  const schemaTarget = path.join(prismaDir, 'schema.prisma');
  
  if (fs.existsSync(schemaSource)) {
    fs.copyFileSync(schemaSource, schemaTarget);
    console.log('✅ Schema copiado a prisma/schema.prisma');
  } else {
    console.log('❌ No se encontró schema.prisma en la raíz');
    process.exit(1);
  }

  // Generar el cliente de Prisma
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Cliente de Prisma generado exitosamente');
  
} catch (error) {
  console.error('❌ Error generando cliente de Prisma:', error.message);
  process.exit(1);
}
