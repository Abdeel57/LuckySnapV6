
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // Enable Cross-Origin Resource Sharing
  
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
  
  app.setGlobalPrefix('api'); // Set a global prefix for all routes
  const port = process.env.PORT || 3001;
  await app.listen(port);
}
bootstrap();
