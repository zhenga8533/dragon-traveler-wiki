import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { ROUTE_META } from '../src/constants/route-meta.ts';

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
