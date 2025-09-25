const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  console.log('🗄️ Configurando base de datos...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos');

    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, 'create-tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Ejecutar el SQL
    await client.query(sql);
    console.log('✅ Tablas creadas exitosamente');
    
  } catch (error) {
    console.error('❌ Error configurando la base de datos:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setupDatabase();
