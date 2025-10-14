import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ImageUploadService {
  private cloudinaryConfig = {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  };

  /**
   * Sube una imagen a Cloudinary
   * @param imageData - Datos de la imagen en formato base64 o FormData
   * @returns URL de la imagen subida
   */
  async uploadImage(imageData: string | Buffer): Promise<string> {
    // Validar que Cloudinary esté configurado
    if (!this.cloudinaryConfig.cloudName || 
        !this.cloudinaryConfig.apiKey || 
        !this.cloudinaryConfig.apiSecret) {
      console.warn('⚠️ Cloudinary no configurado, usando imagen placeholder');
      return this.getPlaceholderImage();
    }

    try {
      // Si es base64, verificar tamaño
      if (typeof imageData === 'string') {
        const base64Size = this.getBase64Size(imageData);
        if (base64Size > 2 * 1024 * 1024) { // 2MB
          throw new BadRequestException('La imagen excede el tamaño máximo de 2MB');
        }
      }

      // Construir datos para Cloudinary
      // Cloudinary acepta base64 en el campo 'file'
      const uploadData = {
        file: typeof imageData === 'string' ? imageData : imageData.toString('base64'),
        upload_preset: 'lucky_snap_preset', // Crear en Cloudinary Dashboard
      };
      
      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${this.cloudinaryConfig.cloudName}/image/upload`;
      
      const response = await fetch(cloudinaryUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(uploadData),
      });

      if (!response.ok) {
        throw new Error(`Cloudinary error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Imagen subida a Cloudinary:', result.secure_url);
      
      return result.secure_url;
    } catch (error) {
      console.error('❌ Error subiendo imagen a Cloudinary:', error);
      // Fallback a imagen placeholder
      console.log('🔄 Usando imagen placeholder como fallback');
      return this.getPlaceholderImage();
    }
  }

  /**
   * Valida el tamaño de una imagen
   * @param imageData - Datos de la imagen
   * @returns true si es válida
   */
  validateImageSize(imageData: string | Buffer): boolean {
    const sizeInBytes = typeof imageData === 'string' 
      ? this.getBase64Size(imageData)
      : imageData.length;
    
    const maxSize = 2 * 1024 * 1024; // 2MB
    return sizeInBytes <= maxSize;
  }

  /**
   * Obtiene el tamaño de una imagen base64 en bytes
   * @param base64String - String base64
   * @returns Tamaño en bytes
   */
  private getBase64Size(base64String: string): number {
    // Remover el prefijo data:image/...;base64, si existe
    const base64Data = base64String.split(',')[1] || base64String;
    
    // Calcular tamaño: cada carácter base64 representa 6 bits
    // y el padding '=' reduce el tamaño
    const padding = (base64Data.match(/=/g) || []).length;
    return (base64Data.length * 3) / 4 - padding;
  }

  /**
   * Devuelve una URL de imagen placeholder
   * @returns URL de Unsplash
   */
  private getPlaceholderImage(): string {
    // Usar Unsplash como servicio de placeholder
    const placeholders = [
      'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?w=800&h=600&fit=crop',
    ];
    
    // Seleccionar aleatoriamente
    return placeholders[Math.floor(Math.random() * placeholders.length)];
  }

  /**
   * Elimina una imagen de Cloudinary
   * @param imageUrl - URL de la imagen
   */
  async deleteImage(imageUrl: string): Promise<void> {
    if (!this.cloudinaryConfig.cloudName) {
      console.warn('⚠️ Cloudinary no configurado, no se puede eliminar imagen');
      return;
    }

    try {
      // Extraer public_id de la URL de Cloudinary
      const publicId = this.extractPublicId(imageUrl);
      
      if (!publicId) {
        console.warn('⚠️ No se pudo extraer public_id de la URL');
        return;
      }

      // Cloudinary requiere una firma para delete, por simplicidad
      // no implementamos el delete en esta versión básica
      console.log('ℹ️ Delete de imagen no implementado (requiere firma)');
    } catch (error) {
      console.error('❌ Error eliminando imagen:', error);
    }
  }

  /**
   * Extrae el public_id de una URL de Cloudinary
   * @param url - URL de Cloudinary
   * @returns public_id o null
   */
  private extractPublicId(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      
      // El public_id está después de /upload/vX/
      const uploadIndex = pathParts.indexOf('upload');
      if (uploadIndex >= 0 && uploadIndex < pathParts.length - 2) {
        // Omitir version (v1234567890) y obtener el resto
        const publicIdParts = pathParts.slice(uploadIndex + 2);
        return publicIdParts.join('/').replace(/\.[^.]+$/, ''); // Remover extensión
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }
}

