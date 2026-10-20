import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  const rootDir = typeof import.meta.dirname !== 'undefined' ? import.meta.dirname : path.resolve('.');

  const aiScanMiddleware = async (req: any, res: any, next: any) => {
    if (req.url === '/api/ai/scan-performa' && req.method === 'POST') {
      try {
        let rawBody = '';
        for await (const chunk of req) {
          rawBody += chunk;
        }
        req.body = rawBody ? JSON.parse(rawBody) : {};
        const mod = await import('./api/ai/scan-performa.ts');
        return await mod.default(req, res);
      } catch (err: any) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: false, error: err?.message || 'Internal Server Error' }));
        return;
      }
    }
    next();
  };

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'api-ai-scan-middleware',
        configureServer(server) {
          server.middlewares.use(aiScanMiddleware);
        },
        configurePreviewServer(server) {
          server.middlewares.use(aiScanMiddleware);
        }
      }
    ],
    resolve: {
      alias: {
        '@': rootDir,
      },
    },
    build: {
      chunkSizeWarningLimit: 1200,
    },
    envPrefix: ['VITE_', 'SUPABASE_'],
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
