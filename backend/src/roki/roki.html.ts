/**
 * Página HTML mínima servida por el backend al volver de ROKI o al abrir un
 * enlace de pago por folio cuando no hay que redirigir. Sirve con cualquier
 * versión del frontend: no depende de rutas nuevas en la tienda.
 */

export interface HtmlAction {
  label: string;
  href: string;
  primary?: boolean;
}

export interface HtmlPageInput {
  tone: 'success' | 'warning' | 'danger' | 'info';
  title: string;
  message: string;
  details?: Array<[string, string]>;
  actions?: HtmlAction[];
  refreshSeconds?: number;
  refreshUrl?: string;
  footnote?: string;
}

const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

const TONES: Record<HtmlPageInput['tone'], { accent: string; soft: string; icon: string }> = {
  success: { accent: '#047857', soft: '#d1fae5', icon: '✓' },
  warning: { accent: '#b45309', soft: '#fef3c7', icon: '!' },
  danger: { accent: '#b91c1c', soft: '#fee2e2', icon: '×' },
  info: { accent: '#4338ca', soft: '#e0e7ff', icon: '…' },
};

export function renderPaymentPage(input: HtmlPageInput): string {
  const tone = TONES[input.tone];
  const refresh = input.refreshSeconds && input.refreshUrl
    ? `<meta http-equiv="refresh" content="${Math.max(2, Math.floor(input.refreshSeconds))};url=${escapeHtml(input.refreshUrl)}">`
    : '';
  const details = (input.details ?? [])
    .map(([label, value]) => `<div class="row"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`)
    .join('');
  const actions = (input.actions ?? [])
    .map((a) => `<a class="btn${a.primary ? ' primary' : ''}" href="${escapeHtml(a.href)}">${escapeHtml(a.label)}</a>`)
    .join('');

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="referrer" content="no-referrer">
${refresh}
<title>${escapeHtml(input.title)} · Lucky Snap</title>
<style>
  :root { color-scheme: light; --accent: ${tone.accent}; --soft: ${tone.soft}; }
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px 16px;
         font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; background: #f4f5f7; color: #111827; }
  main { width: 100%; max-width: 440px; background: #fff; border-radius: 20px; padding: 28px 22px; box-shadow: 0 10px 30px rgb(17 24 39 / 0.08); text-align: center; }
  .icon { width: 56px; height: 56px; margin: 0 auto 14px; border-radius: 999px; display: flex; align-items: center; justify-content: center;
          background: var(--soft); color: var(--accent); font-size: 28px; font-weight: 800; }
  h1 { margin: 0 0 8px; font-size: 22px; line-height: 1.25; }
  p { margin: 0; color: #4b5563; line-height: 1.5; }
  .details { margin: 18px 0 4px; padding: 14px; border-radius: 14px; background: #f9fafb; text-align: left; }
  .row { display: flex; justify-content: space-between; gap: 12px; padding: 4px 0; font-size: 14px; }
  .row span { color: #6b7280; }
  .row strong { text-align: right; word-break: break-all; }
  .actions { display: grid; gap: 10px; margin-top: 20px; }
  .btn { display: block; padding: 13px 16px; border-radius: 999px; border: 1px solid #d1d5db; color: #111827; text-decoration: none; font-weight: 700; }
  .btn.primary { background: #111827; border-color: #111827; color: #fff; }
  .foot { margin-top: 16px; font-size: 12px; color: #9ca3af; }
</style>
</head>
<body>
<main>
  <div class="icon" aria-hidden="true">${tone.icon}</div>
  <h1>${escapeHtml(input.title)}</h1>
  <p>${escapeHtml(input.message)}</p>
  ${details ? `<div class="details">${details}</div>` : ''}
  ${actions ? `<div class="actions">${actions}</div>` : ''}
  ${input.footnote ? `<p class="foot">${escapeHtml(input.footnote)}</p>` : ''}
</main>
</body>
</html>`;
}
