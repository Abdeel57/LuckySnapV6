// Utilidades para generar variantes de imagen vía parámetros de query.
// Soporta Cloudinary (transformaciones en ruta) y otros CDNs (query params).

export type OutputFormat = 'auto' | 'webp' | 'avif' | 'jpeg' | 'png';

/**
 * Detecta si una URL es de Cloudinary
 */
function isCloudinaryUrl(url: string): boolean {
    try {
        const { hostname } = new URL(url, window.location.origin);
        return hostname.includes('cloudinary.com');
    } catch {
        return false;
    }
}

/**
 * Extrae la URL base de Cloudinary (sin transformaciones existentes)
 * Maneja URLs con y sin versión: /upload/v123/image.jpg o /upload/image.jpg
 */
function extractCloudinaryBaseUrl(url: string): string | null {
    try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/').filter(p => p !== '');
        const uploadIndex = pathParts.indexOf('upload');
        
        if (uploadIndex === -1) return null;
        
        // Buscar 'v' (versión) después de 'upload'
        // Formato puede ser: /upload/[transformaciones]/v[version]/[public_id].[ext]
        // O: /upload/v[version]/[public_id].[ext]
        // O: /upload/[public_id].[ext]
        
        let versionIndex = -1;
        for (let i = uploadIndex + 1; i < pathParts.length; i++) {
            const part = pathParts[i];
            // Detectar versión: "v" seguido de números
            if (/^v\d+$/.test(part)) {
                versionIndex = i;
                break;
            }
            // Si encontramos un punto (extensión), ya no hay versión
            if (part.includes('.')) {
                break;
            }
        }
        
        // Construir URL base
        const baseParts = ['', ...pathParts.slice(0, uploadIndex + 1)];
        
        if (versionIndex !== -1) {
            // Con versión: incluir versión y archivo
            const version = pathParts[versionIndex];
            const filename = pathParts[pathParts.length - 1];
            baseParts.push(version, filename);
        } else {
            // Sin versión: solo archivo
            const filename = pathParts[pathParts.length - 1];
            baseParts.push(filename);
        }
        
        urlObj.pathname = baseParts.join('/');
        // Mantener query params si existen
        return urlObj.toString();
    } catch {
        return null;
    }
}

/**
 * Construye URL de Cloudinary con transformaciones
 * Formato: /upload/w_[width],q_[quality],f_[format]/[resto]
 */
function buildCloudinaryUrl(baseUrl: string, width: number, quality: string = 'auto', format: string = 'auto'): string {
    try {
        const urlObj = new URL(baseUrl);
        const pathParts = urlObj.pathname.split('/').filter(p => p !== '');
        const uploadIndex = pathParts.indexOf('upload');
        
        if (uploadIndex === -1) return baseUrl;
        
        // Construir transformaciones
        const transformations = `w_${width},q_${quality},f_${format}`;
        
        // Insertar transformaciones después de 'upload'
        // Formato: /upload/[transformaciones]/v[version]/[public_id].[ext]
        // O: /upload/[transformaciones]/[public_id].[ext]
        
        const newPathParts = [...pathParts];
        newPathParts.splice(uploadIndex + 1, 0, transformations);
        
        urlObj.pathname = '/' + newPathParts.join('/');
        return urlObj.toString();
    } catch {
        return baseUrl; // Fallback a URL original
    }
}

function supportsWidthParam(originalUrl: string): boolean {
    try {
        const { hostname } = new URL(originalUrl, window.location.origin);
        // Proveedores comunes que aceptan parámetros de transformación en query
        // NOTA: res.cloudinary.com se maneja por separado (no usa query params)
        const allowedHosts = [
            'images.unsplash.com',
            'ik.imagekit.io',
            'imagedelivery.net', // Cloudflare Images
            'cdn.sanity.io',
            'storage.googleapis.com',
            'firebasestorage.googleapis.com',
            'media.graphassets.com',
            'imgix.net',
        ];
        return allowedHosts.some(h => hostname.endsWith(h));
    } catch {
        return false;
    }
}

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
    // Manejar Cloudinary con transformaciones en ruta
    if (isCloudinaryUrl(sourceUrl)) {
        const baseUrl = extractCloudinaryBaseUrl(sourceUrl);
        if (baseUrl) {
            // Usar calidad 'auto' para optimización automática de Cloudinary
            // f_auto permite que Cloudinary elija el mejor formato (WebP/AVIF según navegador)
            const quality = 'auto'; // Cloudinary optimiza automáticamente
            const formatStr = format === 'auto' ? 'auto' : format;
            const transformedUrl = buildCloudinaryUrl(baseUrl, width, quality, formatStr);
            return transformedUrl;
        }
        // Si no se puede extraer URL base, usar URL original (fallback)
        return sourceUrl;
    }
    
    // Para otros servicios (Unsplash, etc.), usar query params
    if (!supportsWidthParam(sourceUrl)) {
        // Host no soporta transforms por query; devolver URL original
        return sourceUrl;
    }
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


