
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false, // Disable default body parser
  });
  
  // Configure body parser with increased limit for images
  const express = require('express');
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  
  // Enable CORS with specific configuration
  app.enableCors({
    origin: [
      /^http:\/\/localhost:5173$/, // Vite dev server
      /\.onrender\.com$/, // Any Render subdomain
      /\.netlify\.app$/, // Any Netlify subdomain
      /dashboard\.render\.com$/ // Render dashboard
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
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
