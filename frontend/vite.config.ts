import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // IMPORTANT:
    // Load env vars from the repo root so users can follow `env.example` at the root.
    // This also ensures `import.meta.env.VITE_API_URL` is available even if `.env` lives in the root.
    const envDir = path.resolve(__dirname, '..');
    const env = loadEnv(mode, envDir, '');

    // La API (datos e imágenes /uploads) está en la ruta crítica del LCP de todas las
    // páginas públicas: abrir la conexión mientras se descarga el JS ahorra DNS+TCP+TLS.
    const apiPreconnect = {
      name: 'api-preconnect',
      transformIndexHtml() {
        let origin: string;
        try {
          origin = new URL(env.VITE_API_URL).origin;
        } catch {
          return [];
        }
        return [
          // fetch() sin credenciales usa el pool "crossorigin"; <img> usa el pool sin él
          { tag: 'link', attrs: { rel: 'preconnect', href: origin, crossorigin: '' }, injectTo: 'head-prepend' as const },
          { tag: 'link', attrs: { rel: 'preconnect', href: origin }, injectTo: 'head-prepend' as const },
        ];
      },
    };

    return {
      base: '/',
      envDir,
      server: {
        port: 5173,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: 'http://localhost:3000',
            changeOrigin: true,
            secure: false
          }
        }
      },
      plugins: [react(), apiPreconnect],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || 'http://localhost:3000/api')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        outDir: 'dist',
        sourcemap: false,
        minify: 'terser',
        rollupOptions: {
          output: {
            // framer-motion queda fuera a propósito: solo lo usan componentes de rutas diferidas
            // y, agrupado con los iconos del Header, se precargaba en todas las páginas.
            manualChunks: {
              vendor: ['react', 'react-dom'],
              router: ['react-router-dom'],
              icons: ['lucide-react']
            }
          }
        }
      }
    };
});
