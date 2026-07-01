/**
 * Migra imágenes de Cloudinary al Volume del backend.
 *
 * Recorre Raffle.imageUrl, Raffle.gallery, Winner.imageUrl,
 * Settings.logo y Settings.favicon. Por cada URL de Cloudinary la descarga,
 * la re-sube al backend (que la guarda en el Volume) y actualiza la BD.
 *
 * Uso:
 *   node migrar-imagenes-cloudinary.js
 *       -> DIAGNÓSTICO: cuenta cuántas URLs son de Cloudinary. No modifica.
 *   node migrar-imagenes-cloudinary.js migrar
 *       -> MIGRA de verdad. Necesita que el Volume ya esté montado y que
 *          IMAGE_STORAGE_PATH + PUBLIC_BASE_URL estén configuradas en Railway.
 *
 * Configuración (opcional):
 *   API_URL   URL base del backend (default: la que apunta netlify.toml)
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const API_URL =
  process.env.API_URL || 'https://luckysnapv6-production.up.railway.app/api';

function readEnvDatabaseUrl() {
  const envPath = path.join(__dirname, '.env');
  const content = fs.readFileSync(envPath, 'utf8');
  const m = content.match(/^\s*DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/m);
  return m ? m[1].trim() : null;
}

function isCloudinary(url) {
  if (!url || typeof url !== 'string') return false;
  return /res\.cloudinary\.com|cloudinary\.com\/[^/]+\/image\/upload/.test(url);
}

async function downloadAsBase64(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Descarga falló (${res.status}) ${url}`);
  const contentType = res.headers.get('content-type') || 'image/jpeg';
  const buf = Buffer.from(await res.arrayBuffer());
  return `data:${contentType};base64,${buf.toString('base64')}`;
}

async function uploadToBackend(base64) {
  const res = await fetch(`${API_URL}/upload/image`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageData: base64 }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.url) {
    throw new Error(`Upload falló (${res.status}): ${json?.message || 'sin respuesta'}`);
  }
  return json.url;
}

async function migrate(url, cache) {
  if (cache.has(url)) return cache.get(url);
  const base64 = await downloadAsBase64(url);
  const newUrl = await uploadToBackend(base64);
  cache.set(url, newUrl);
  return newUrl;
}

async function main() {
  const mode = (process.argv[2] || 'diagnostico').toLowerCase();
  const apply = mode === 'migrar';
  const dbUrl = readEnvDatabaseUrl();
  if (!dbUrl) throw new Error('No se encontró DATABASE_URL en backend/.env');
  const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });

  const cache = new Map(); // old URL -> new URL, evita re-subir duplicadas
  const stats = { raffleMain: 0, raffleGallery: 0, winner: 0, logo: 0, favicon: 0 };
  const errors = [];

  console.log('🔎 Escaneando la BD...\n');

  const raffles = await prisma.raffle.findMany({
    select: { id: true, title: true, imageUrl: true, gallery: true },
  });
  const winners = await prisma.winner.findMany({
    select: { id: true, name: true, imageUrl: true },
  });
  const settings = await prisma.settings.findMany({
    select: { id: true, logo: true, favicon: true },
  });

  for (const r of raffles) {
    if (isCloudinary(r.imageUrl)) stats.raffleMain++;
    const gallery = Array.isArray(r.gallery) ? r.gallery : [];
    for (const g of gallery) {
      const gu = typeof g === 'string' ? g : g?.url;
      if (isCloudinary(gu)) stats.raffleGallery++;
    }
  }
  for (const w of winners) if (isCloudinary(w.imageUrl)) stats.winner++;
  for (const s of settings) {
    if (isCloudinary(s.logo)) stats.logo++;
    if (isCloudinary(s.favicon)) stats.favicon++;
  }

  const total = Object.values(stats).reduce((a, b) => a + b, 0);
  console.log('URLs de Cloudinary encontradas:');
  console.log('   Rifas (imageUrl principal):', stats.raffleMain);
  console.log('   Rifas (galería):           ', stats.raffleGallery);
  console.log('   Ganadores:                 ', stats.winner);
  console.log('   Settings.logo:             ', stats.logo);
  console.log('   Settings.favicon:          ', stats.favicon);
  console.log('   TOTAL:                     ', total);

  if (!apply) {
    console.log('\n(Modo diagnóstico, no se modifica nada. Para migrar corre con "migrar".)');
    await prisma.$disconnect();
    return;
  }

  if (total === 0) {
    console.log('\nNo hay nada que migrar.');
    await prisma.$disconnect();
    return;
  }

  console.log(`\n🚀 Migrando ${total} imágenes...\n`);

  // Rifas: imageUrl + gallery
  for (const r of raffles) {
    const update = {};
    if (isCloudinary(r.imageUrl)) {
      try {
        update.imageUrl = await migrate(r.imageUrl, cache);
        console.log(`   ✔ Rifa "${r.title}" imageUrl migrada`);
      } catch (e) {
        errors.push({ where: `Raffle ${r.id} imageUrl`, url: r.imageUrl, error: e.message });
      }
    }
    const gallery = Array.isArray(r.gallery) ? r.gallery : null;
    if (gallery) {
      const newGallery = [];
      let changed = false;
      for (const g of gallery) {
        const gu = typeof g === 'string' ? g : g?.url;
        if (isCloudinary(gu)) {
          try {
            const nu = await migrate(gu, cache);
            newGallery.push(typeof g === 'string' ? nu : { ...g, url: nu });
            changed = true;
          } catch (e) {
            errors.push({ where: `Raffle ${r.id} gallery`, url: gu, error: e.message });
            newGallery.push(g);
          }
        } else {
          newGallery.push(g);
        }
      }
      if (changed) update.gallery = newGallery;
    }
    if (Object.keys(update).length) {
      await prisma.raffle.update({ where: { id: r.id }, data: update });
    }
  }

  // Winners
  for (const w of winners) {
    if (isCloudinary(w.imageUrl)) {
      try {
        const nu = await migrate(w.imageUrl, cache);
        await prisma.winner.update({ where: { id: w.id }, data: { imageUrl: nu } });
        console.log(`   ✔ Ganador "${w.name}" migrado`);
      } catch (e) {
        errors.push({ where: `Winner ${w.id}`, url: w.imageUrl, error: e.message });
      }
    }
  }

  // Settings
  for (const s of settings) {
    const update = {};
    if (isCloudinary(s.logo)) {
      try {
        update.logo = await migrate(s.logo, cache);
        console.log(`   ✔ Settings.logo migrado`);
      } catch (e) {
        errors.push({ where: `Settings ${s.id} logo`, url: s.logo, error: e.message });
      }
    }
    if (isCloudinary(s.favicon)) {
      try {
        update.favicon = await migrate(s.favicon, cache);
        console.log(`   ✔ Settings.favicon migrado`);
      } catch (e) {
        errors.push({ where: `Settings ${s.id} favicon`, url: s.favicon, error: e.message });
      }
    }
    if (Object.keys(update).length) {
      await prisma.settings.update({ where: { id: s.id }, data: update });
    }
  }

  console.log('\n========== RESUMEN ==========');
  console.log(`✅ Imágenes únicas re-subidas: ${cache.size}`);
  console.log(`❌ Errores: ${errors.length}`);
  if (errors.length) {
    for (const e of errors) console.log(`   - ${e.where}: ${e.error}`);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ Error fatal:', e);
  process.exit(1);
});
