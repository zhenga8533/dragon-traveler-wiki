import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildRouteHtml,
  cleanGameText,
  normalizeTypeKey,
} from '../scripts/generate-route-pages.mjs';

const BASE_HTML = `<!doctype html>
<html>
  <head>
    <title>Dragon Traveler Wiki</title>
    <meta name="description" content="Default description" />
    <meta property="og:title" content="Dragon Traveler Wiki" />
    <meta property="og:description" content="Default description" />
    <meta property="og:url" content="https://dtwiki.org" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Dragon Traveler Wiki" />
    <meta property="og:image" content="https://dtwiki.org/default.jpg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="Default" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Dragon Traveler Wiki" />
    <meta name="twitter:description" content="Default description" />
    <meta name="twitter:image" content="https://dtwiki.org/default.jpg" />
    <meta name="twitter:image:alt" content="Default" />
  </head>
</html>`;

test('wide entity embeds include complete Open Graph and Twitter metadata', () => {
  const image = {
    url: 'https://dtwiki.org/assets/character/athena/scene.png',
    alt: 'Athena default scene illustration',
    width: 2340,
    height: 1080,
    type: 'image/png',
    cardType: 'summary_large_image',
  };
  const html = buildRouteHtml(
    BASE_HTML,
    '/characters/athena',
    { title: 'Athena', description: 'Frontline Guardian.' },
    'Dragon Traveler Wiki',
    'https://dtwiki.org',
    image
  );

  assert.match(html, /<title>Athena \| Dragon Traveler Wiki<\/title>/);
  assert.match(
    html,
    /property="og:image" content="https:\/\/dtwiki\.org\/assets\/character\/athena\/scene\.png"/
  );
  assert.match(html, /property="og:image:secure_url"/);
  assert.match(html, /property="og:image:width" content="2340"/);
  assert.match(html, /property="og:image:height" content="1080"/);
  assert.match(html, /property="og:image:type" content="image\/png"/);
  assert.match(
    html,
    /name="twitter:card" content="summary_large_image"/
  );
  assert.match(
    html,
    /name="twitter:image:alt" content="Athena default scene illustration"/
  );
});

test('square entity embeds use summary cards without inaccurate dimensions', () => {
  const html = buildRouteHtml(
    BASE_HTML,
    '/artifacts/example',
    { title: 'Example', description: 'Example artifact.' },
    'Dragon Traveler Wiki',
    'https://dtwiki.org',
    {
      url: 'https://dtwiki.org/assets/artifacts/example/artifact.png',
      alt: 'Example artifact',
      type: 'image/png',
      cardType: 'summary',
    }
  );

  assert.match(html, /name="twitter:card" content="summary"/);
  assert.doesNotMatch(html, /property="og:image:width"/);
  assert.doesNotMatch(html, /property="og:image:height"/);
});

test('embed text and asset keys are normalized for game data', () => {
  assert.equal(normalizeTypeKey("Dragon's Call"), 'dragons_call');
  assert.equal(
    cleanGameText('Applies {stun} after [Martial Verdict].'),
    'Applies Stun after Martial Verdict.'
  );
});
