import { Injectable, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Copia permanente de las imágenes subidas, en la base de datos.
 *
 * El disco de Railway es efímero salvo que haya un Volume montado: el
 * 2026-10-31 un redespliegue borró las 5 fotos del sorteo activo. Desde ahora
 * cada imagen se guarda también en la tabla "stored_images" y, si falta en
 * disco, /uploads la sirve desde la base (y la vuelve a escribir en disco).
 * La tabla se crea al arrancar con SQL idempotente que coincide con el modelo
 * StoredImage de schema.prisma (no se usa `prisma migrate`: la tabla
 * _prisma_migrations de producción no es estándar).
 */

export const SAFE_IMAGE_NAME = /^[A-Za-z0-9_-]{1,120}\.(jpg|jpeg|png|webp|gif|avif)$/i;
/** Nombres generados por ImageUploadService: luckysnap_<ms>_<12 hex>.<ext> */
export const GENERATED_IMAGE_NAME = /^luckysnap_\d{13}_[a-f0-9]{12}\.(jpg|png|webp|gif|avif)$/;

export const MIME_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  avif: 'image/avif',
};

export const IMAGE_STORE_STATEMENTS: readonly string[] = [
  `CREATE TABLE IF NOT EXISTS "stored_images" (
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "stored_images_pkey" PRIMARY KEY ("filename")
  )`,
];

/** Tipo real según los primeros bytes (no confiar en la extensión). */
export function detectImageMime(bytes: Buffer): string | null {
  if (!bytes || bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (bytes.subarray(0, 3).toString('ascii') === 'GIF') return 'image/gif';
  if (bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  if (bytes.subarray(4, 8).toString('ascii') === 'ftyp' && /avi[fs]/.test(bytes.subarray(8, 12).toString('ascii'))) return 'image/avif';
  return null;
}

export const mimeForFilename = (filename: string): string => MIME_BY_EXT[filename.split('.').pop()!.toLowerCase()] ?? 'application/octet-stream';

export function resolveUploadsDir(): string {
  return process.env.IMAGE_STORAGE_PATH ? path.resolve(process.env.IMAGE_STORAGE_PATH) : path.resolve(process.cwd(), 'uploads');
}

@Injectable()
export class ImageStoreService implements OnModuleInit {
  private ready = false;
  private readonly dir = resolveUploadsDir();

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    try {
      await this.ensureTable();
      const copied = await this.backfillFromDisk();
      const total = await this.prisma.storedImage.count();
      console.log(`🗄️ Imágenes con copia permanente en la base: ${total}${copied ? ` (${copied} copiadas desde disco ahora)` : ''}`);
    } catch (error) {
      console.error('❌ No se pudo preparar la copia permanente de imágenes:', error instanceof Error ? error.message : error);
    }
  }

  async ensureTable() {
    for (const statement of IMAGE_STORE_STATEMENTS) await this.prisma.$executeRawUnsafe(statement);
    this.ready = true;
  }

  /** Guarda (o deja como está si ya existe) la copia permanente de una imagen. */
  async save(filename: string, mimeType: string, data: Buffer): Promise<void> {
    if (!this.ready) await this.ensureTable();
    const sha256 = crypto.createHash('sha256').update(data).digest('hex');
    await this.prisma.storedImage.upsert({
      where: { filename },
      create: { filename, mimeType, size: data.length, sha256, data },
      update: {},
    });
  }

  async load(filename: string): Promise<{ mimeType: string; data: Buffer } | null> {
    if (!SAFE_IMAGE_NAME.test(filename)) return null;
    const row = await this.prisma.storedImage.findUnique({ where: { filename }, select: { mimeType: true, data: true } });
    return row ? { mimeType: row.mimeType, data: Buffer.from(row.data) } : null;
  }

  async exists(filename: string): Promise<boolean> {
    return (await this.prisma.storedImage.count({ where: { filename } })) > 0;
  }

  async remove(filename: string): Promise<void> {
    await this.prisma.storedImage.deleteMany({ where: { filename } });
  }

  /** Vuelve a escribir en disco una imagen servida desde la base (caché; si falla no importa). */
  cacheToDisk(filename: string, data: Buffer) {
    if (!SAFE_IMAGE_NAME.test(filename)) return;
    const target = path.join(this.dir, filename);
    fs.promises
      .mkdir(this.dir, { recursive: true })
      .then(() => fs.promises.writeFile(target, data, { flag: 'wx' }))
      .catch(() => undefined);
  }

  /** Copia a la base las imágenes que están en disco y aún no tienen copia permanente. */
  async backfillFromDisk(): Promise<number> {
    let files: string[] = [];
    try {
      files = (await fs.promises.readdir(this.dir)).filter((f) => SAFE_IMAGE_NAME.test(f));
    } catch {
      return 0;
    }
    if (files.length === 0) return 0;
    const known = new Set((await this.prisma.storedImage.findMany({ where: { filename: { in: files } }, select: { filename: true } })).map((r) => r.filename));
    let copied = 0;
    for (const file of files) {
      if (known.has(file)) continue;
      try {
        const data = await fs.promises.readFile(path.join(this.dir, file));
        if (data.length === 0 || data.length > 10 * 1024 * 1024) continue;
        await this.save(file, detectImageMime(data) ?? mimeForFilename(file), data);
        copied++;
      } catch (error) {
        console.warn(`⚠️ No se pudo copiar ${file} a la base:`, error instanceof Error ? error.message : error);
      }
    }
    return copied;
  }

  /** ¿Algún sorteo, ganador o ajuste hace referencia a /uploads/<filename>? */
  async isReferenced(filename: string): Promise<boolean> {
    const needle = `%/uploads/${filename}%`;
    const rows = await this.prisma.$queryRaw<Array<{ hit: number }>>`
      SELECT 1 AS hit FROM "raffles" WHERE "imageUrl" LIKE ${needle} OR CAST("gallery" AS TEXT) LIKE ${needle}
      UNION ALL SELECT 1 FROM "winners" WHERE "imageUrl" LIKE ${needle}
      UNION ALL SELECT 1 FROM "settings" WHERE "logo" LIKE ${needle} OR "favicon" LIKE ${needle}
      LIMIT 1`;
    return rows.length > 0;
  }
}
