import assert from 'node:assert/strict';
import test from 'node:test';
import { addLinkedCharacterNames } from '../src/features/search/noble-phantasm-search.ts';

test('noble phantasm search items resolve linked character names', () => {
  const characters = new Map([
    ['athena_ssr_ex', { name: 'Athena' }],
    ['athena_legacy', { name: 'Athena' }],
  ]);
  const items = [
    { slug: 'aegis', character_slug: 'athena_ssr_ex' },
    { slug: 'legacy-aegis', character_slug: 'athena_legacy' },
    { slug: 'unlinked', character_slug: null },
  ];

  assert.deepEqual(addLinkedCharacterNames(items, characters), [
    { ...items[0], characterName: 'Athena' },
    { ...items[1], characterName: 'Athena' },
    { ...items[2], characterName: undefined },
  ]);
});
