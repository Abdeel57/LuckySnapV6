
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as path from 'path';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false, // Disable default body parser
  });

  // Configure body parser with increased limit for images
  const express = require('express');
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Servir imágenes subidas desde el Volume persistente. En Railway, montar el
  // Volume en /data y setear IMAGE_STORAGE_PATH=/data/uploads. Los archivos se
  // guardan y se sirven byte-por-byte (sin transformación) para mantener la
  // calidad original.
  const uploadsDir = process.env.IMAGE_STORAGE_PATH
    ? path.resolve(process.env.IMAGE_STORAGE_PATH)
    : path.resolve(process.cwd(), 'uploads');
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
  } catch (e) {
    console.error(`⚠️ No se pudo preparar directorio de uploads (${uploadsDir}):`, e);
  }
  console.log(`🖼️  Sirviendo /uploads desde: ${uploadsDir}`);
  app.use(
    '/uploads',
    express.static(uploadsDir, {
      maxAge: '30d',
      immutable: true,
      index: false,
      setHeaders: (res: any) => {
        // Los nombres incluyen hash aleatorio, así que son immutables por definición.
        res.setHeader('Cache-Control', 'public, max-age=2592000, immutable');
        // Permitir cargarlas desde cualquier origen (el frontend está en otro dominio).
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      },
    }),
  );
  
  // Enable CORS with specific configuration
  const allowedOrigins = [
    /^http:\/\/localhost:5173$/, // Vite dev server
    /\.onrender\.com$/, // Any Render subdomain
    /\.netlify\.app$/, // Any Netlify subdomain
    /dashboard\.render\.com$/, // Render dashboard
    'https://luckysnaphn.com',
    'https://www.luckysnaphn.com',
    'https://luckysnap.netlify.app', // optional legacy domain
  ];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true); // Allow non-browser requests
      }

      const isAllowed = allowedOrigins.some((allowed) => {
        if (allowed instanceof RegExp) {
          return allowed.test(origin);
        }
        return allowed === origin;
      });

      if (isAllowed) {
        return callback(null, origin);
      }

      console.warn(`CORS bloqueado para origen no permitido: ${origin}`);
      return callback(new Error(`CORS origin not allowed: ${origin}`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  
  // Add a simple root route before setting the global prefix
  app.getHttpAdapter().get('/', (req, res) => {
    res.json({ 
      message: 'Lucky Snap Backend API', 
      status: 'running',
      version: '1.0.0',
      endpoints: {
        api: '/api',
        health: '/api/health'
      }
    });
  });

  // Add health check endpoint
  app.getHttpAdapter().get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });
  
  app.setGlobalPrefix('api'); // Set a global prefix for all routes
  
  const port = process.env.PORT || 3000;
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  console.log(`🚀 Lucky Snap Backend starting...`);
  console.log(`📡 Environment: ${nodeEnv}`);
  console.log(`🌐 Port: ${port}`);
  console.log(`🔗 API Base: http://localhost:${port}/api`);
  
  await app.listen(port);
}
bootstrap();
