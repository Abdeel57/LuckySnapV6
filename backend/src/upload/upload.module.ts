import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { ImageUploadService } from '../services/imageUpload.service';
import { ImageStoreService } from '../services/imageStore.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UploadController],
  providers: [ImageStoreService, ImageUploadService],
  exports: [ImageUploadService, ImageStoreService],
})
export class UploadModule {}

