import { Injectable, BadRequestException, ServiceUnavailableException } from '@nestjs/common';

@Injectable()
export class ImageUploadService {
  private cloudinaryConfig = {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  };
  private uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || 'lucky_snap_preset';
  // Cloudinary UNSIGNED: el parámetro `asset_folder` usa "display name" y puede fallar con
  // "Display name cannot contain slashes". Para organizar, es más robusto usar `folder`,
  // que sí soporta rutas (con `/`) y es compatible con unsigned uploads.
  private folder = process.env.CLOUDINARY_FOLDER || 'luckysnap';

  private createUniquePublicId(): string {
    // Evita colisiones sin depender de APIs de Node que requieran typings extra en el editor.
    return `luckysnap_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }

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
      // No devolver placeholders aleatorios: eso causa que el admin vea "otra imagen"
      // y además oculta el problema real de configuración.
      throw new ServiceUnavailableException(
        'Cloudinary no configurado. Configura CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET.'
      );
    }

    try {
      // Si es base64, verificar tamaño
      if (typeof imageData === 'string') {
        const base64Size = this.getBase64Size(imageData);
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (base64Size > maxSize) {
          throw new BadRequestException('La imagen excede el tamaño máximo de 10MB');
        }
      }

      // Construir datos para Cloudinary
      // Cloudinary acepta base64 en el campo 'file'
      // Nota: estamos usando UNSIGNED upload preset, así que Cloudinary restringe los parámetros permitidos.
      // Por eso NO mandamos overwrite/unique_filename aquí (Cloudinary los rechaza en unsigned).
      const uploadData = {
        file: typeof imageData === 'string' ? imageData : imageData.toString('base64'),
        upload_preset: this.uploadPreset, // Debe existir en Cloudinary (Unsigned upload preset)
        // Evitar colisiones: asignar un public_id único (permitido en unsigned).
        public_id: this.createUniquePublicId(),
        folder: this.folder,
      };
      
      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${this.cloudinaryConfig.cloudName}/image/upload`;
      
      const response = await fetch(cloudinaryUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(uploadData),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        const msg =
          result?.error?.message ||
          result?.message ||
          `Cloudinary error: ${response.status} ${response.statusText}`;
        throw new BadRequestException(msg);
      }

      const secureUrl = result?.secure_url as string | undefined;
      if (!secureUrl) {
        throw new BadRequestException('Cloudinary no devolvió secure_url. Revisa el upload preset/configuración.');
      }

      console.log('✅ Imagen subida a Cloudinary:', secureUrl);
      return secureUrl;
    } catch (error) {
      // No ocultar el error con placeholders: propagar para que el frontend informe correctamente.
      console.error('❌ Error subiendo imagen a Cloudinary:', error);
      if (error instanceof BadRequestException || error instanceof ServiceUnavailableException) {
        throw error;
      }
      throw new BadRequestException('Error al subir la imagen a Cloudinary');
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
    
    const maxSize = 10 * 1024 * 1024; // 10MB
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

