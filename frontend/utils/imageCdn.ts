// Utilidades para generar variantes de imagen vía parámetros de query.
// No asume un CDN específico; agrega ?w= y formato si es posible.

export type OutputFormat = 'auto' | 'webp' | 'avif' | 'jpeg' | 'png';

function joinWithQuery(originalUrl: string, params: Record<string, string | number | undefined>): string {
    try {
        const url = new URL(originalUrl, window.location.origin);
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                url.searchParams.set(key, String(value));
            }
        });
        return url.toString();
    } catch {
        // Fallback si no es una URL absoluta ni relativa parseable
        const hasQuery = originalUrl.includes('?');
        const query = Object.entries(params)
            .filter(([, v]) => v !== undefined && v !== null && v !== '')
            .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
            .join('&');
        if (!query) return originalUrl;
        return `${originalUrl}${hasQuery ? '&' : '?'}${query}`;
    }
}

export function buildVariantUrl(sourceUrl: string, width: number, format: OutputFormat = 'auto'): string {
    const formatParam = format === 'auto' ? undefined : format;
    return joinWithQuery(sourceUrl, { w: width, format: formatParam });
}

export function buildSrcSet(sourceUrl: string, widths: number[], format: OutputFormat = 'auto'): string {
    const unique = Array.from(new Set(widths.filter(w => w > 0))).sort((a, b) => a - b);
    return unique.map(w => `${buildVariantUrl(sourceUrl, w, format)} ${w}w`).join(', ');
}

export function defaultSizes(maxWidthPx: number = 1920): string {
    // Cobertura sensata para hero a pantalla completa
    return `(min-width: 1280px) ${Math.min(maxWidthPx, 1280)}px, (min-width: 768px) 100vw, 100vw`;
}


