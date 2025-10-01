
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'frontend', 'dist')));

// Manejar rutas SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log('🚀 Frontend local funcionando en http://localhost:3001');
  console.log('✅ Puedes probar la sección de apartados localmente');
  console.log('✅ Si funciona aquí, el problema es solo de Netlify');
});
