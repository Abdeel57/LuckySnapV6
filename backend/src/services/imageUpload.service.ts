import { Injectable, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

/**
 * Almacenamiento local de imágenes en el sistema de archivos.
 *
 * En Railway se debe montar un Volume persistente (p. ej. en /data) y setear:
 *   IMAGE_STORAGE_PATH=/data/uploads
 *
 * Localmente, si no está seteada la variable, se usa ./uploads relativo al
 * proceso. El archivo se guarda tal cual llegó (bytes originales, sin
 * transformación) para preservar la calidad al 100%.
 *
 * El servicio devuelve una ruta pública relativa (/uploads/<nombre>.<ext>);
 * el controlador se encarga de convertirla a URL absoluta usando el host de
 * la petición o la variable PUBLIC_BASE_URL.
 */

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
};

@Injectable()
export class ImageUploadService {
  private readonly storagePath: string;

  constructor() {
    const configured = process.env.IMAGE_STORAGE_PATH;
    this.storagePath = configured
      ? path.resolve(configured)
      : path.resolve(process.cwd(), 'uploads');

    try {
      fs.mkdirSync(this.storagePath, { recursive: true });
      console.log(`📁 Directorio de imágenes: ${this.storagePath}`);
    } catch (e) {
      console.error(`❌ No se pudo preparar ${this.storagePath}:`, e);
    }
  }

  /**
   * Guarda una imagen en disco y devuelve la ruta pública relativa.
   * Acepta data URI (`data:image/xxx;base64,...`) o base64 crudo, o un Buffer.
   */
  async uploadImage(imageData: string | Buffer): Promise<string> {
    if (!imageData) {
      throw new BadRequestException('No se proporcionó imagen');
    }

    let bytes: Buffer;
    let ext = 'bin';

    if (typeof imageData === 'string') {
      const dataUriMatch = imageData.match(/^data:([^;]+);base64,(.+)$/);
      let base64Payload: string;
      if (dataUriMatch) {
        const mime = dataUriMatch[1].toLowerCase();
        ext = MIME_TO_EXT[mime] || 'bin';
        base64Payload = dataUriMatch[2];
      } else {
        base64Payload = imageData;
      }
      if (this.base64Size(base64Payload) > MAX_SIZE_BYTES) {
        throw new BadRequestException('La imagen excede el tamaño máximo de 10MB');
      }
      bytes = Buffer.from(base64Payload, 'base64');
    } else {
      bytes = imageData;
      if (bytes.length > MAX_SIZE_BYTES) {
        throw new BadRequestException('La imagen excede el tamaño máximo de 10MB');
      }
    }

    if (!bytes || bytes.length === 0) {
      throw new BadRequestException('Los datos de la imagen están vacíos o mal formados');
    }

    if (ext === 'bin') {
      ext = this.detectExtFromBuffer(bytes);
    }

    const filename = this.createUniqueFilename(ext);
    const fullPath = path.join(this.storagePath, filename);

    try {
      await fs.promises.writeFile(fullPath, bytes);
    } catch (e) {
      console.error('❌ Error escribiendo imagen a disco:', e);
      throw new BadRequestException('No se pudo guardar la imagen en el servidor');
    }

    const relativeUrl = `/uploads/${filename}`;
    console.log(`✅ Imagen guardada (${bytes.length} bytes): ${relativeUrl}`);
    return relativeUrl;
  }

  validateImageSize(imageData: string | Buffer): boolean {
    if (typeof imageData === 'string') {
      const payload = imageData.startsWith('data:')
        ? imageData.split(',')[1] || ''
        : imageData;
      return this.base64Size(payload) <= MAX_SIZE_BYTES;
    }
    return imageData.length <= MAX_SIZE_BYTES;
  }

  /**
   * Elimina una imagen local. Ignora URLs externas (Cloudinary previo)
   * y bloquea path traversal.
   */
  async deleteImage(imageUrl: string): Promise<void> {
    if (!imageUrl) return;
    let relativePath = imageUrl;
    try {
      if (/^https?:\/\//i.test(imageUrl)) {
        const u = new URL(imageUrl);
        relativePath = u.pathname;
      }
    } catch {
      /* no-op: usar imageUrl como pathname */
    }
    if (!relativePath.startsWith('/uploads/')) return;

    const filename = path.basename(relativePath);
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return;
    }
    const fullPath = path.join(this.storagePath, filename);
    try {
      await fs.promises.unlink(fullPath);
      console.log(`🗑️ Imagen eliminada: ${filename}`);
    } catch (e: any) {
      if (e && e.code !== 'ENOENT') {
        console.warn('⚠️ No se pudo eliminar imagen:', e.message);
      }
    }
  }

  private createUniqueFilename(ext: string): string {
    const rnd = crypto.randomBytes(6).toString('hex');
    return `luckysnap_${Date.now()}_${rnd}.${ext}`;
  }

  private base64Size(base64Payload: string): number {
    const padding = (base64Payload.match(/=/g) || []).length;
    return Math.floor((base64Payload.length * 3) / 4) - padding;
  }

  /**
   * Detecta la extensión por los "magic bytes" del contenido. Se usa cuando
   * el cliente mandó base64 crudo sin data URI.
   */
  private detectExtFromBuffer(buf: Buffer): string {
    if (buf.length < 12) return 'bin';
    if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'png';
    if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return 'gif';
    if (
      buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
      buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
    ) return 'webp';
    return 'bin';
  }
}
