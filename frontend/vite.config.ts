import react from '@vitejs/plugin-react';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import type { Plugin } from 'vite';
import { defineConfig } from 'vite';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';
import {
  BASE_URL,
  DEFAULT_IMAGE,
  ROUTE_META,
  SITE_NAME,
} from './src/constants/route-meta';

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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildRouteEmbedHtml(
  routePath: string,
  title: string,
  description: string
): string {
  const pageTitle = title === SITE_NAME ? SITE_NAME : `${title} | ${SITE_NAME}`;
  const pageUrl = `${BASE_URL}${routePath}`;
  const escapedTitle = escapeHtml(pageTitle);
  const escapedDescription = escapeHtml(description);
  const escapedUrl = escapeHtml(pageUrl);
  const escapedImage = escapeHtml(DEFAULT_IMAGE);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapedTitle}</title>
    <meta name="description" content="${escapedDescription}" />
    <meta property="og:title" content="${escapedTitle}" />
    <meta property="og:description" content="${escapedDescription}" />
    <meta property="og:url" content="${escapedUrl}" />
    <meta property="og:type" content="website" />
    <meta property="og:image" content="${escapedImage}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapedTitle}" />
    <meta name="twitter:description" content="${escapedDescription}" />
    <meta name="twitter:image" content="${escapedImage}" />
    <script>
      window.location.replace('/#${routePath}');
    </script>
  </head>
  <body></body>
</html>`;
}

function generateStaticRouteEmbeds(): Plugin {
  return {
    name: 'generate-static-route-embeds',
    apply: 'build',
    generateBundle() {
      const concreteRoutes = ROUTE_META.filter(
        ({ pattern }) => pattern !== '*' && !pattern.includes(':')
      );

      for (const { pattern, meta } of concreteRoutes) {
        if (pattern === '/') {
          continue;
        }

        const normalized = pattern.replace(/^\//, '');
        const html = buildRouteEmbedHtml(pattern, meta.title, meta.description);

        this.emitFile({
          type: 'asset',
          fileName: `${normalized}.html`,
          source: html,
        });

        this.emitFile({
          type: 'asset',
          fileName: `${normalized}/index.html`,
          source: html,
        });
      }
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    serveDataDir(),
    generateStaticRouteEmbeds(),
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
    ...(process.env.ANALYZE === 'true'
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
});
