import { Controller, Post, Body, Req, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import type { Request } from 'express';
import { ImageUploadService } from '../services/imageUpload.service';

interface UploadImageDto {
  imageData: string;
}

@Controller('upload')
export class UploadController {
  constructor(private readonly imageUploadService: ImageUploadService) {}

  @Post('image')
  async uploadImage(@Body() uploadDto: UploadImageDto, @Req() req: Request) {
    try {
      if (!uploadDto?.imageData) {
        throw new BadRequestException('No se proporcionó imagen');
      }

      if (!this.imageUploadService.validateImageSize(uploadDto.imageData)) {
        throw new BadRequestException({
          statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
          message: 'La imagen excede el tamaño máximo permitido de 10MB',
          error: 'Payload Too Large',
        });
      }

      const relativeUrl = await this.imageUploadService.uploadImage(uploadDto.imageData);

      // URL absoluta: preferimos PUBLIC_BASE_URL (más predecible detrás de
      // proxies) y como fallback usamos el host de la petición.
      const configured = (process.env.PUBLIC_BASE_URL || '').replace(/\/+$/, '');
      const requestHost = req.get('host');
      const forwardedProto = (req.headers['x-forwarded-proto'] as string || '').split(',')[0].trim();
      const protocol = forwardedProto || req.protocol || 'http';
      const fallbackBase = requestHost ? `${protocol}://${requestHost}` : '';
      const baseUrl = configured || fallbackBase;
      const absoluteUrl = baseUrl ? `${baseUrl}${relativeUrl}` : relativeUrl;

      return {
        success: true,
        url: absoluteUrl,
        message: 'Imagen subida correctamente',
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      if (error instanceof HttpException) throw error;
      console.error('Error en uploadImage:', error);
      throw new BadRequestException('Error al subir la imagen');
    }
  }
}
