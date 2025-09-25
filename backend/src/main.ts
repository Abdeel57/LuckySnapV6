
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // Enable Cross-Origin Resource Sharing
  app.setGlobalPrefix('api'); // Set a global prefix for all routes
  const port = process.env.PORT || 3001;
  await app.listen(port);
}
bootstrap();
