/**
 * RECUPERACIÓN DE BOLETOS AUTO-LIBERADOS
 * =======================================
 *
 * La auto-liberación NO borra nada: solo cambia el estado de la orden de
 * PENDING a CANCELLED y le agrega la nota "[Auto-release: Expired]".
 * Los números de boleto, cliente, folio y total quedan intactos, así que
 * se pueden restaurar.
 *
 * MODOS DE USO:
 *
 *   node recuperar-boletos.js
 *       -> DIAGNÓSTICO (solo lectura). No modifica nada.
 *          Muestra cuántas órdenes pendientes están en riesgo y lista las
 *          ya auto-liberadas, marcando cuáles tienen CONFLICTO (boletos que
 *          ya fueron retomados por otra orden activa/pagada).
 *
 *   node recuperar-boletos.js proteger
 *       -> DETIENE LA HEMORRAGIA. Empuja el expiresAt de TODAS las órdenes
 *          PENDIENTES a una fecha lejana, para que la auto-liberación deje
 *          de cancelarlas mientras revisas. Reversible.
 *
 *   node recuperar-boletos.js restaurar
 *       -> Restaura a PENDING las órdenes auto-liberadas (últimas 72h) que
 *          NO tengan conflicto, con expiración lejana y una nota de control.
 *          Luego debes revisar y marcar como PAGADAS las que correspondan.
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const AUTO_NOTE = '[Auto-release: Expired]';
// Marcador que el backend respeta para NO recalcular expiresAt al guardar ajustes
// ni cancelar la orden en el job de auto-expiración. Cualquier orden con esta
// marca queda "blindada" frente a futuros cambios automáticos.
const PROTECT_MARKER = '[NO_AUTO_RELEASE]';
// Ventana por defecto para buscar liberaciones recientes. Se puede sobrescribir
// con la variable de entorno WINDOW_HOURS (ej: WINDOW_HOURS=720 para 30 días).
const WINDOW_HOURS = Number(process.env.WINDOW_HOURS) || 72;
const FAR_FUTURE = new Date('2027-12-31T23:59:59Z');

// URLs de respaldo (mismas que usan los scripts existentes del proyecto)
const FALLBACK_URLS = [
  'postgresql://postgres:ZuCkGpLHcIJynmWvsMEqzIzypbuXotKm@nozomi.proxy.rlwy.net:50670/railway',
  'postgresql://postgres:soOPSwrlxnEjSmXKXzsFZJNrgfLQqzyC@centerbeam.proxy.rlwy.net:27393/railway',
];

function readEnvDatabaseUrl() {
  try {
    const envPath = path.join(__dirname, '.env');
    if (!fs.existsSync(envPath)) return null;
    const content = fs.readFileSync(envPath, 'utf8');
    const match = content.match(/^\s*DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/m);
    return match ? match[1].trim() : null;
  } catch {
    return null;
  }
}

function mask(url) {
  return url.replace(/:\/\/[^@]+@/, '://***:***@');
}

async function getPrisma() {
  const urls = [];
  const envUrl = readEnvDatabaseUrl();
  if (envUrl) urls.push(envUrl);
  urls.push(...FALLBACK_URLS);

  for (const url of urls) {
    const prisma = new PrismaClient({ datasources: { db: { url } } });
    try {
      await prisma.$connect();
      console.log(`✅ Conectado a: ${mask(url)}`);
      return prisma;
    } catch (e) {
      console.log(`❌ Falló: ${mask(url)} (${String(e.message).split('\n')[0]})`);
      await prisma.$disconnect().catch(() => {});
    }
  }
  throw new Error('No se pudo conectar a ninguna base de datos.');
}

function overlap(a, b) {
  const set = new Set(b || []);
  return (a || []).filter((t) => set.has(t));
}

async function loadActiveByRaffle(prisma, raffleIds) {
  const map = {};
  for (const rid of raffleIds) {
    map[rid] = await prisma.order.findMany({
      where: { raffleId: rid, status: { in: ['PENDING', 'PAID'] } },
      select: { id: true, folio: true, status: true, tickets: true },
    });
  }
  return map;
}

async function getReleased(prisma) {
  const since = new Date(Date.now() - WINDOW_HOURS * 60 * 60 * 1000);
  return prisma.order.findMany({
    where: {
      status: 'CANCELLED',
      notes: { contains: AUTO_NOTE },
      updatedAt: { gte: since },
    },
    include: {
      user: true,
      raffle: { select: { id: true, title: true, tickets: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });
}

async function diagnose(prisma) {
  console.log('\n========== DIAGNÓSTICO (solo lectura, no modifica nada) ==========\n');
  const now = new Date();

  const pending = await prisma.order.findMany({
    where: { status: 'PENDING' },
    select: { id: true, expiresAt: true },
  });
  const pastDue = pending.filter((o) => o.expiresAt && o.expiresAt < now);
  console.log(`📌 Órdenes PENDIENTES actuales: ${pending.length}`);
  console.log(`   ⚠️  Ya vencidas (se liberan en el próximo ciclo de 15 min): ${pastDue.length}`);
  if (pastDue.length) {
    console.log('   👉 Corre  "node recuperar-boletos.js proteger"  para FRENAR esto ya.\n');
  }

  const released = await getReleased(prisma);
  console.log(`\n♻️  Órdenes auto-liberadas en las últimas ${WINDOW_HOURS}h: ${released.length}\n`);
  if (released.length === 0) {
    console.log('   (Nada que recuperar en la ventana.)');
    return;
  }

  const raffleIds = [...new Set(released.map((o) => o.raffleId))];
  const activeByRaffle = await loadActiveByRaffle(prisma, raffleIds);

  let recoverable = 0;
  let conflicted = 0;

  for (const o of released) {
    const actives = activeByRaffle[o.raffleId] || [];
    const conflicts = [];
    for (const a of actives) {
      const ov = overlap(o.tickets, a.tickets);
      if (ov.length) conflicts.push({ folio: a.folio, status: a.status, tickets: ov });
    }
    const hasConflict = conflicts.length > 0;
    hasConflict ? conflicted++ : recoverable++;

    console.log('────────────────────────────────────────');
    console.log(`Folio:    ${o.folio}   ${hasConflict ? '⛔ CONFLICTO' : '✅ recuperable'}`);
    console.log(`Cliente:  ${o.user?.name || 's/n'}  ${o.user?.phone || ''}  ${o.user?.email || ''}`);
    console.log(`Rifa:     ${o.raffle?.title || o.raffleId}`);
    console.log(`Boletos:  [${(o.tickets || []).join(', ')}]  (${(o.tickets || []).length} boletos)`);
    console.log(`Total:    ${o.total}`);
    console.log(`Creada:   ${o.createdAt?.toISOString()}`);
    console.log(`Liberada: ${o.updatedAt?.toISOString()}  (UTC)`);
    for (const c of conflicts) {
      console.log(`   ⛔ Boletos [${c.tickets.join(', ')}] ya están en la orden ${c.folio} (${c.status})`);
    }
  }

  console.log('\n========== RESUMEN ==========');
  console.log(`Total auto-liberadas (${WINDOW_HOURS}h): ${released.length}`);
  console.log(`✅ Recuperables sin conflicto:   ${recoverable}`);
  console.log(`⛔ Con conflicto (revisar a mano): ${conflicted}`);
  console.log('\nSi el listado se ve bien:');
  console.log('  1) node recuperar-boletos.js proteger    (frena la liberación en curso)');
  console.log('  2) node recuperar-boletos.js restaurar   (recupera las que no tienen conflicto)');
}

async function proteger(prisma) {
  console.log('\n========== PROTEGER (detener auto-liberación) ==========\n');
  // Marcar y empujar expiresAt para todas las PENDING. El marcador hace que el
  // backend (>=fix) ya no las recalcule ni cancele en ciclos posteriores.
  const pending = await prisma.order.findMany({
    where: { status: 'PENDING' },
    select: { id: true, notes: true },
  });
  let count = 0;
  for (const o of pending) {
    const notes = (o.notes || '').includes(PROTECT_MARKER)
      ? (o.notes || '')
      : `${o.notes || ''}\n${PROTECT_MARKER}`;
    await prisma.order.update({
      where: { id: o.id },
      data: { expiresAt: FAR_FUTURE, notes },
    });
    count++;
  }
  console.log(`🛡️  ${count} órdenes PENDIENTES protegidas (expiresAt + marcador ${PROTECT_MARKER}).`);
  console.log('   El backend (con el fix) ya no las tocará al guardar ajustes ni en auto-expire.');
}

async function restaurar(prisma) {
  console.log('\n========== RESTAURAR órdenes auto-liberadas ==========\n');
  const now = new Date();
  const released = await getReleased(prisma);
  if (released.length === 0) {
    console.log('No hay órdenes auto-liberadas en la ventana. Nada que restaurar.');
    return;
  }

  const raffleIds = [...new Set(released.map((o) => o.raffleId))];
  const activeByRaffle = await loadActiveByRaffle(prisma, raffleIds);

  let restored = 0;
  let skipped = 0;

  for (const o of released) {
    const actives = activeByRaffle[o.raffleId] || [];
    const conflictTickets = [];
    for (const a of actives) {
      const ov = overlap(o.tickets, a.tickets);
      if (ov.length) conflictTickets.push(...ov);
    }

    if (conflictTickets.length) {
      skipped++;
      console.log(`⏭️  Omitida ${o.folio}: boletos en conflicto [${[...new Set(conflictTickets)].join(', ')}]`);
      continue;
    }

    await prisma.order.update({
      where: { id: o.id },
      data: {
        status: 'PENDING',
        expiresAt: FAR_FUTURE,
        notes: `${o.notes || ''}\n[Recuperado ${now.toISOString()} - revisar pago] ${PROTECT_MARKER}`,
      },
    });
    // Marcar estos boletos como ocupados para que otra orden posterior detecte el conflicto
    activeByRaffle[o.raffleId] = [
      ...actives,
      { id: o.id, folio: o.folio, status: 'PENDING', tickets: o.tickets },
    ];
    restored++;
    console.log(`✅ Restaurada ${o.folio}  (${(o.tickets || []).length} boletos)`);
  }

  console.log('\n========== RESUMEN ==========');
  console.log(`✅ Restauradas a PENDING: ${restored}`);
  console.log(`⏭️  Omitidas por conflicto: ${skipped}`);
  console.log('\nQuedaron en PENDING con expiración lejana. Ahora entra al panel y marca');
  console.log('como PAGADAS las órdenes cuyos clientes realmente pagaron.');
}

async function main() {
  const mode = (process.argv[2] || 'diagnostico').toLowerCase();
  const prisma = await getPrisma();
  try {
    if (mode === 'proteger') await proteger(prisma);
    else if (mode === 'restaurar') await restaurar(prisma);
    else await diagnose(prisma);
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

main().catch((e) => {
  console.error('❌ Error:', e);
  process.exit(1);
});
