/**
 * Exporta a CSV las órdenes PENDING blindadas con [NO_AUTO_RELEASE]
 * (las recuperadas el 2026-06-03) para identificarlas y marcar pagos
 * fácilmente desde Excel/Google Sheets.
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

function readEnvDatabaseUrl() {
  const envPath = path.join(__dirname, '.env');
  const content = fs.readFileSync(envPath, 'utf8');
  const m = content.match(/^\s*DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/m);
  return m ? m[1].trim() : null;
}

function csvEscape(val) {
  if (val === null || val === undefined) return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

async function main() {
  const url = readEnvDatabaseUrl();
  const prisma = new PrismaClient({ datasources: { db: { url } } });

  const rows = await prisma.order.findMany({
    where: { status: 'PENDING', notes: { contains: '[NO_AUTO_RELEASE]' } },
    include: {
      user: { select: { name: true, phone: true, email: true, district: true } },
      raffle: { select: { title: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const header = [
    'folio',
    'cliente',
    'telefono',
    'email',
    'distrito',
    'rifa',
    'metodo_pago',
    'total',
    'cantidad_boletos',
    'boletos',
    'creada_utc',
    'recuperada_utc',
  ];
  const lines = [header.join(',')];

  for (const o of rows) {
    lines.push(
      [
        csvEscape(o.folio),
        csvEscape(o.user?.name),
        csvEscape(o.user?.phone),
        csvEscape(o.user?.email),
        csvEscape(o.user?.district),
        csvEscape(o.raffle?.title),
        csvEscape(o.paymentMethod || 'transfer'),
        csvEscape(o.total),
        csvEscape((o.tickets || []).length),
        csvEscape((o.tickets || []).join(' ')),
        csvEscape(o.createdAt?.toISOString()),
        csvEscape(o.updatedAt?.toISOString()),
      ].join(',')
    );
  }

  const out = path.join(__dirname, '..', 'ordenes-recuperadas.csv');
  fs.writeFileSync(out, '﻿' + lines.join('\n'), 'utf8');
  console.log(`✅ Exportadas ${rows.length} órdenes a:`);
  console.log(`   ${out}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
