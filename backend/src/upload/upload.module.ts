import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { ImageUploadService } from '../services/imageUpload.service';

@Module({
  controllers: [UploadController],
  providers: [ImageUploadService],
  exports: [ImageUploadService],
})
export class UploadModule {}

