import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { ROUTE_META } from '../src/constants/route-meta.ts';
import { LEGACY_ROUTE_ALIASES } from '../scripts/generate-route-pages.mjs';

const normalizePattern = (pattern) => pattern.replace(/:[^/]+/g, ':param');

test('route metadata patterns are unique and complete', () => {
  const patterns = ROUTE_META.map(({ pattern }) => pattern);
  assert.equal(new Set(patterns).size, patterns.length);
  for (const { pattern, meta } of ROUTE_META) {
    assert.ok(pattern.length > 0);
    assert.ok(meta.title.length > 0);
    assert.ok(meta.description.length > 0);
  }
});

test('every metadata route has a matching application route', async () => {
  const source = await readFile('src/routes/AppRoutes.tsx', 'utf8');
  const applicationPatterns = [...source.matchAll(/<Route\s+path="([^"]+)"/g)]
    .map((match) => normalizePattern(match[1]));
  const expectedPatterns = ROUTE_META
    .map(({ pattern }) => pattern)
    .filter((pattern) => pattern !== '*')
    .map(normalizePattern);

  for (const pattern of expectedPatterns) {
    assert.ok(applicationPatterns.includes(pattern), `Missing route: ${pattern}`);
  }
});

test('every application content route has metadata or a documented fallback', async () => {
  const source = await readFile('src/routes/AppRoutes.tsx', 'utf8');
  const applicationPatterns = [...source.matchAll(/<Route\s+path="([^"]+)"/g)]
    .map((match) => normalizePattern(match[1]))
    .filter((pattern) => pattern !== '*');
  const metadataPatterns = new Set(
    ROUTE_META.map(({ pattern }) => normalizePattern(pattern))
  );
  const supportedLegacyPatterns = new Set(['/useful-links', '/guides/*']);
  const clientOnlyPatterns = new Set(['/teams/saved/:param']);

  for (const pattern of applicationPatterns) {
    assert.ok(
      metadataPatterns.has(pattern) ||
        supportedLegacyPatterns.has(pattern) ||
        clientOnlyPatterns.has(pattern),
      `Application route has no embed policy: ${pattern}`
    );
  }

  for (const [aliasPath, targetPath] of LEGACY_ROUTE_ALIASES) {
    assert.ok(metadataPatterns.has(targetPath), `Invalid alias target: ${targetPath}`);
    assert.ok(aliasPath.startsWith('/'), `Invalid alias path: ${aliasPath}`);
  }
});
