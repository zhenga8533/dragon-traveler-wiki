import react from '@vitejs/plugin-react';
import { createReadStream, existsSync, readFileSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { visualizer } from 'rollup-plugin-visualizer';
import type { Plugin } from 'vite';
import { defineConfig } from 'vite';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';
import { loadProjectEnv } from './scripts/project-env.mjs';
import {
  buildVersionPlugin,
  resolveBuildId,
} from './scripts/build-version.mjs';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

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

const EXT_MIME: Record<string, string> = {
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.mp4': 'video/mp4',
  '.glb': 'model/gltf-binary',
  '.json': 'application/json',
};

function serveAssetsDir(assetsDir: string): Plugin {
  const prefixes = ['/assets/', '/dragon-traveler-wiki/assets/'];
  return {
    name: 'serve-assets-dir',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const requestUrl = (req.url ?? '').split('?')[0];
        for (const prefix of prefixes) {
          if (requestUrl.startsWith(prefix)) {
            const filename = requestUrl.slice(prefix.length);
            const ext = path.extname(filename).toLowerCase();
            const mime = EXT_MIME[ext];
            const filepath = path.join(assetsDir, filename);
            if (mime && existsSync(filepath)) {
              const { size } = statSync(filepath);
              res.setHeader('Content-Type', mime);
              res.setHeader('Content-Length', size);

              if (ext === '.mp4') {
                res.setHeader('Accept-Ranges', 'bytes');
                const range = req.headers.range;
                const match = range?.match(/^bytes=(\d*)-(\d*)$/);

                if (range && !match) {
                  res.statusCode = 416;
                  res.setHeader('Content-Range', `bytes */${size}`);
                  res.end();
                  return;
                }

                if (match) {
                  const requestedStart = match[1]
                    ? Number.parseInt(match[1], 10)
                    : null;
                  const requestedEnd = match[2]
                    ? Number.parseInt(match[2], 10)
                    : null;
                  const start =
                    requestedStart ??
                    Math.max(0, size - (requestedEnd ?? size));
                  const end = Math.min(
                    requestedStart == null
                      ? size - 1
                      : (requestedEnd ?? size - 1),
                    size - 1,
                  );

                  if (start > end || start >= size) {
                    res.statusCode = 416;
                    res.setHeader('Content-Range', `bytes */${size}`);
                    res.end();
                    return;
                  }

                  res.statusCode = 206;
                  res.setHeader(
                    'Content-Range',
                    `bytes ${start}-${end}/${size}`,
                  );
                  res.setHeader('Content-Length', end - start + 1);
                  if (req.method === 'HEAD') {
                    res.end();
                  } else {
                    createReadStream(filepath, { start, end }).pipe(res);
                  }
                  return;
                }
              }

              if (req.method === 'HEAD') {
                res.end();
              } else {
                createReadStream(filepath).pipe(res);
              }
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
  const { env, dataDir, assetsDir } = loadProjectEnv(mode, rootDir);
  const appBase = env.VITE_APP_BASE ?? '/';
  const buildId = resolveBuildId(env);

  return {
    plugins: [
      buildVersionPlugin(buildId, appBase),
      react(),
      serveDataDir(dataDir),
      serveAssetsDir(assetsDir),
      ViteImageOptimizer({
        png: { quality: 85 },
        jpeg: { quality: 85 },
        jpg: { quality: 85 },
        webp: { quality: 85 },
      }),
      ...(mode === 'analyze' || env.ANALYZE === 'true'
        ? [
            visualizer({
              filename: 'dist/stats.html',
              gzipSize: true,
              brotliSize: true,
            }),
          ]
        : []),
    ],
    base: appBase,
    resolve: {
      alias: {
        '@': path.resolve(rootDir, './src'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('vite/preload-helper')) return 'vite-runtime';
            if (id.includes('node_modules/@mantine/')) return 'mantine';
            if (id.includes('node_modules/three/build/three.core.js')) {
              return 'three-core';
            }
            if (id.includes('node_modules/three/build/three.module.js')) {
              return 'three-renderer';
            }
            if (
              id.includes('node_modules/@react-three/') ||
              id.includes('node_modules/three-stdlib/') ||
              id.includes('node_modules/three/examples/')
            ) {
              return 'react-three';
            }
            if (
              id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-router')
            ) {
              return 'react-vendor';
            }
            if (id.includes('node_modules/react-icons/')) return 'icons';
          },
        },
      },
    },
  };
});
