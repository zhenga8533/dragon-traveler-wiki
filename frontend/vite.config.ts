import react from '@vitejs/plugin-react';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import type { Plugin } from 'vite';
import { defineConfig } from 'vite';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';

function serveDataDir(): Plugin {
  const dataDir = path.resolve(__dirname, '../data');
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

export default defineConfig({
  plugins: [
    react(),
    serveDataDir(),
    ViteImageOptimizer({
      png: {
        quality: 85,
      },
      jpeg: {
        quality: 85,
      },
      jpg: {
        quality: 85,
      },
      webp: {
        quality: 85,
      },
    }),
  ],
  base: '/',
});
