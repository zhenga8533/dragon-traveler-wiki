import react from '@vitejs/plugin-react';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import type { Plugin } from 'vite';
import { defineConfig, loadEnv } from 'vite';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';

function serveDataDir(dataDir: string): Plugin {
  const prefixes = ['/data/', '/dragon-traveler-wiki/data/'];
  return {
    name: 'serve-data-dir',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const requestUrl = req.url ?? '';
        for (const prefix of prefixes) {
          if (requestUrl.startsWith(prefix)) {
            const filename = requestUrl.slice(prefix.length);
            const filepath = path.join(dataDir, filename);
            if (existsSync(filepath)) {
              res.setHeader('Content-Type', 'application/json');
              res.end(readFileSync(filepath, 'utf-8'));
              return;
            }
          }
        }
        next();
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const dataDir = path.resolve(process.cwd(), env.DATA_DIR ?? 'data');

  return {
    plugins: [
      react(),
      serveDataDir(dataDir),
      ViteImageOptimizer({
        png: { quality: 85 },
        jpeg: { quality: 85 },
        jpg: { quality: 85 },
        webp: { quality: 85 },
      }),
      ...(env.ANALYZE === 'true'
        ? [
            visualizer({
              filename: 'dist/stats.html',
              gzipSize: true,
              brotliSize: true,
            }),
          ]
        : []),
    ],
    base: '/',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  };
});
