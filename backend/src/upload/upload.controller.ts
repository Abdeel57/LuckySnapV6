import { Controller, Post, Body, BadRequestException, HttpStatus } from '@nestjs/common';
import { ImageUploadService } from '../services/imageUpload.service';

interface UploadImageDto {
  imageData: string;
}

@Controller('upload')
export class UploadController {
  constructor(private readonly imageUploadService: ImageUploadService) {}

  @Post('image')
  async uploadImage(@Body() uploadDto: UploadImageDto) {
    try {
      if (!uploadDto.imageData) {
        throw new BadRequestException('No se proporcionó imagen');
      }

      // Validar tamaño antes de subir
      if (!this.imageUploadService.validateImageSize(uploadDto.imageData)) {
        throw new BadRequestException({
          statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
          message: 'La imagen excede el tamaño máximo permitido de 2MB',
          error: 'Payload Too Large',
        });
      }

      const imageUrl = await this.imageUploadService.uploadImage(uploadDto.imageData);
      
      return {
        success: true,
        url: imageUrl,
        message: 'Imagen subida correctamente',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      console.error('Error en uploadImage:', error);
      throw new BadRequestException('Error al subir la imagen');
    }
  }
}

