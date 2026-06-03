/**
 * Restauración de órdenes RE-CANCELADAS: las que ya habíamos recuperado
 * (tienen nota "[Recuperado ...]") y volvieron a quedar en CANCELLED por el
 * recompute del 28 de mayo. Las pone de nuevo en PENDING con expiresAt 2027 y
 * marcador [NO_AUTO_RELEASE] para que el backend (con el fix) las respete.
 *
 * Uso:  node recuperar-re-canceladas.js              (DIAGNÓSTICO solo lectura)
 *       node recuperar-re-canceladas.js restaurar    (aplica los cambios)
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const PROTECT_MARKER = '[NO_AUTO_RELEASE]';
const FAR_FUTURE = new Date('2027-12-31T23:59:59Z');

function readEnvDatabaseUrl() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return null;
  const content = fs.readFileSync(envPath, 'utf8');
  const match = content.match(/^\s*DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/m);
  return match ? match[1].trim() : null;
}

function overlap(a, b) {
  const set = new Set(b || []);
  return (a || []).filter((t) => set.has(t));
}

async function main() {
  const mode = (process.argv[2] || 'diagnostico').toLowerCase();
  const url = readEnvDatabaseUrl();
  if (!url) {
    console.error('No se encontró DATABASE_URL en backend/.env');
    process.exit(1);
  }
  const prisma = new PrismaClient({ datasources: { db: { url } } });

  // 1) Encontrar las re-canceladas: status CANCELLED + nota [Recuperado*]
  const candidates = await prisma.order.findMany({
    where: {
      status: 'CANCELLED',
      notes: { contains: '[Recuperado' },
    },
    include: {
      user: { select: { name: true, phone: true, email: true } },
      raffle: { select: { title: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  console.log(`\n📋 Encontradas ${candidates.length} órdenes re-canceladas (status=CANCELLED + nota Recuperado).`);
  if (candidates.length === 0) {
    await prisma.$disconnect();
    return;
  }

  // 2) Detección de conflictos: cargar órdenes activas (PENDING/PAID) por rifa
  const raffleIds = [...new Set(candidates.map((o) => o.raffleId))];
  const activeByRaffle = {};
  for (const rid of raffleIds) {
    activeByRaffle[rid] = await prisma.order.findMany({
      where: { raffleId: rid, status: { in: ['PENDING', 'PAID'] } },
      select: { folio: true, status: true, tickets: true },
    });
  }

  let willRestore = 0;
  let willSkip = 0;
  const conflictList = [];
  for (const o of candidates) {
    const actives = activeByRaffle[o.raffleId] || [];
    const clashes = [];
    for (const a of actives) {
      const ov = overlap(o.tickets, a.tickets);
      if (ov.length) clashes.push({ folio: a.folio, status: a.status, tickets: ov });
    }
    if (clashes.length) {
      willSkip++;
      conflictList.push({ folio: o.folio, clashes });
    } else {
      willRestore++;
    }
  }

  console.log(`   ✅ Restaurables (sin conflicto): ${willRestore}`);
  console.log(`   ⛔ Con conflicto:                ${willSkip}`);
  if (conflictList.length) {
    console.log('\nConflictos detectados:');
    for (const c of conflictList) {
      console.log(`   - ${c.folio}: ${c.clashes.map((x) => `${x.tickets.join(',')} -> ${x.folio} (${x.status})`).join('; ')}`);
    }
  }

  if (mode !== 'restaurar') {
    console.log('\n(Modo diagnóstico, no se modificó nada. Corre con argumento "restaurar" para aplicar.)');
    await prisma.$disconnect();
    return;
  }

  console.log('\n🚀 Aplicando restauración...');
  const now = new Date();
  let restored = 0;
  let skipped = 0;
  for (const o of candidates) {
    const actives = activeByRaffle[o.raffleId] || [];
    const clash = actives.some((a) => overlap(o.tickets, a.tickets).length > 0);
    if (clash) {
      skipped++;
      console.log(`⏭️  Omitida ${o.folio} (conflicto)`);
      continue;
    }
    const newNotes = `${o.notes || ''}\n[Re-Recuperada ${now.toISOString()} - revisar pago] ${PROTECT_MARKER}`;
    await prisma.order.update({
      where: { id: o.id },
      data: { status: 'PENDING', expiresAt: FAR_FUTURE, notes: newNotes },
    });
    activeByRaffle[o.raffleId] = [
      ...actives,
      { folio: o.folio, status: 'PENDING', tickets: o.tickets },
    ];
    restored++;
  }

  console.log(`\n========== RESUMEN ==========`);
  console.log(`✅ Restauradas a PENDING:        ${restored}`);
  console.log(`⏭️  Omitidas por conflicto:      ${skipped}`);
  console.log(`🛡️  Marcador aplicado:           ${PROTECT_MARKER}`);
  console.log('\nLas restauradas quedan PENDING con expiresAt 2027 y el marcador');
  console.log('[NO_AUTO_RELEASE]. Cuando redepliegues el backend con el fix, los');
  console.log('próximos cambios de ajustes y el job de auto-expire ya las respetarán.');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ Error:', e);
  process.exit(1);
});
