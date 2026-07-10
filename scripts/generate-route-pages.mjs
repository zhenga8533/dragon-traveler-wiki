import {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const distDir = path.resolve(projectRoot, 'dist');
const dataDir = path.resolve(projectRoot, process.env.DATA_DIR || '../data');
const routeMetaPath = path.resolve(projectRoot, 'src/constants/route-meta.ts');
const indexHtmlPath = path.join(distDir, 'index.html');

const rawAssetsBase = process.env.VITE_ASSETS_BASE ?? '';
const assetsBase =
  rawAssetsBase.startsWith('http://') || rawAssetsBase.startsWith('https://')
    ? rawAssetsBase.endsWith('/')
      ? rawAssetsBase
      : `${rawAssetsBase}/`
    : null;

function normalizeTypeKey(value) {
  return String(value ?? '').toLowerCase().replace(/\s+/g, '_');
}

function normalizeQualityKey(quality) {
  return String(quality ?? '').toLowerCase().replace('+', '_plus');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toEntitySlug(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[-\s]+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function truncateText(value, maxLength = 240) {
  const text = String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

function readJsonArray(fileName) {
  const filePath = path.join(dataDir, fileName);
  if (!existsSync(filePath)) {
    return [];
  }

  try {
    const parsed = JSON.parse(readFileSync(filePath, 'utf-8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseRouteMetaSource(source) {
  const getConstExpression = (name) => {
    const match = source.match(
      new RegExp(`export\\s+const\\s+${name}\\s*=\\s*([^;]+);`)
    );
    return match ? match[1].trim() : null;
  };

  const resolveStringValue = (expression, substitutions = {}) => {
    if (!expression) {
      return null;
    }

    if (
      (expression.startsWith("'") && expression.endsWith("'")) ||
      (expression.startsWith('"') && expression.endsWith('"'))
    ) {
      return expression.slice(1, -1);
    }

    if (expression.startsWith('`') && expression.endsWith('`')) {
      const templateBody = expression.slice(1, -1);
      return templateBody.replace(/\$\{([^}]+)\}/g, (_, key) => {
        const trimmedKey = String(key).trim();
        return substitutions[trimmedKey] ?? '';
      });
    }

    return substitutions[expression] ?? null;
  };

  const siteName = resolveStringValue(getConstExpression('SITE_NAME'));
  const baseUrl = resolveStringValue(getConstExpression('BASE_URL'));
  const defaultImage = resolveStringValue(getConstExpression('DEFAULT_IMAGE'), {
    BASE_URL: baseUrl ?? '',
  });

  const routeMetaStart = source.indexOf('export const ROUTE_META');
  if (routeMetaStart === -1) {
    throw new Error('Could not find ROUTE_META export in route-meta.ts');
  }

  const arrayStart = source.indexOf('[', routeMetaStart);
  const arrayEnd = source.lastIndexOf('];');
  if (arrayStart === -1 || arrayEnd === -1 || arrayEnd <= arrayStart) {
    throw new Error('Could not parse ROUTE_META array in route-meta.ts');
  }

  const routeMetaChunk = source.slice(arrayStart, arrayEnd);
  const entryRegex =
    /\{\s*pattern:\s*'([^']+)'[^{}]*?meta:\s*\{\s*title:\s*'([^']+)'\s*,\s*description:\s*'((?:\\'|[^'])*)'\s*,?\s*\}\s*,?\s*\}/g;

  const routes = [];
  let match;
  while ((match = entryRegex.exec(routeMetaChunk)) !== null) {
    routes.push({
      pattern: match[1],
      meta: {
        title: match[2],
        description: match[3].replace(/\\'/g, "'").replace(/\s+/g, ' ').trim(),
      },
    });
  }

  return {
    siteName,
    baseUrl,
    defaultImage,
    routes,
  };
}

function upsertMeta(html, attr, key, value) {
  const pattern = new RegExp(
    `<meta\\s+${attr}=["']${escapeRegExp(key)}["']\\s+content=["'][^"']*["']\\s*\\/?>`,
    'i'
  );
  const replacement = `<meta ${attr}="${key}" content="${escapeHtml(value)}" />`;

  if (pattern.test(html)) {
    return html.replace(pattern, replacement);
  }

  return html.replace(/<\/head>/i, `    ${replacement}\n  </head>`);
}

function removeMeta(html, attr, key) {
  const pattern = new RegExp(
    `\\s*<meta\\s+${attr}=["']${escapeRegExp(key)}["']\\s+content=["'][^"']*["']\\s*\\/?>`,
    'i'
  );
  return html.replace(pattern, '');
}

function writeHtmlForPath(routePath, html) {
  const normalized = routePath.replace(/^\//, '');
  const flatPath = path.join(distDir, `${normalized}.html`);
  const nestedDir = path.join(distDir, normalized);
  const nestedIndexPath = path.join(nestedDir, 'index.html');

  mkdirSync(path.dirname(flatPath), { recursive: true });
  mkdirSync(nestedDir, { recursive: true });

  writeFileSync(flatPath, html, 'utf-8');
  writeFileSync(nestedIndexPath, html, 'utf-8');
}

function buildRouteHtml(
  indexHtml,
  routePath,
  meta,
  siteName,
  baseUrl,
  imageUrl,
  cardType = 'summary_large_image'
) {
  const pageTitle =
    meta.title === siteName ? siteName : `${meta.title} | ${siteName}`;
  const pageUrl = `${baseUrl}${routePath}`;

  let html = indexHtml.replace(
    /<title>[\s\S]*?<\/title>/i,
    `<title>${escapeHtml(pageTitle)}</title>`
  );
  html = upsertMeta(html, 'name', 'description', meta.description);
  html = upsertMeta(html, 'property', 'og:title', pageTitle);
  html = upsertMeta(html, 'property', 'og:description', meta.description);
  html = upsertMeta(html, 'property', 'og:url', pageUrl);
  html = upsertMeta(html, 'property', 'og:type', 'website');
  html = upsertMeta(html, 'property', 'og:site_name', siteName);
  html = upsertMeta(html, 'name', 'twitter:title', pageTitle);
  html = upsertMeta(html, 'name', 'twitter:description', meta.description);

  html = removeMeta(html, 'property', 'og:image:secure_url');

  if (cardType === 'summary_no_image') {
    html = removeMeta(html, 'property', 'og:image');
    html = removeMeta(html, 'property', 'og:image:width');
    html = removeMeta(html, 'property', 'og:image:height');
    html = removeMeta(html, 'property', 'og:image:alt');
    html = removeMeta(html, 'name', 'twitter:image');
    html = removeMeta(html, 'name', 'twitter:image:alt');
    html = upsertMeta(html, 'name', 'twitter:card', 'summary');
  } else {
    const isDefaultImage =
      imageUrl === `${baseUrl}/images/banners/default-social.jpg`;
    html = upsertMeta(html, 'property', 'og:image', imageUrl);
    if (isDefaultImage) {
      html = upsertMeta(html, 'property', 'og:image:width', '1200');
      html = upsertMeta(html, 'property', 'og:image:height', '630');
    } else {
      html = removeMeta(html, 'property', 'og:image:width');
      html = removeMeta(html, 'property', 'og:image:height');
    }
    html = upsertMeta(html, 'property', 'og:image:alt', `${pageTitle} preview`);
    html = upsertMeta(html, 'name', 'twitter:image', imageUrl);
    html = upsertMeta(html, 'name', 'twitter:image:alt', `${pageTitle} preview`);
    html = upsertMeta(
      html,
      'name',
      'twitter:card',
      cardType === 'summary' ? 'summary' : 'summary_large_image'
    );
  }

  return html;
}


function writeRoutePages() {
  if (!existsSync(indexHtmlPath)) {
    throw new Error(
      'dist/index.html not found. Run vite build before generating route pages.'
    );
  }

  const routeMetaSource = readFileSync(routeMetaPath, 'utf-8');
  const { siteName, baseUrl, defaultImage, routes } =
    parseRouteMetaSource(routeMetaSource);

  if (!siteName || !baseUrl || !defaultImage) {
    throw new Error(
      'Could not parse SITE_NAME, BASE_URL, or DEFAULT_IMAGE from route-meta.ts'
    );
  }

  const indexHtml = readFileSync(indexHtmlPath, 'utf-8');
  const routeMetaByPattern = new Map(
    routes.map((route) => [route.pattern, route.meta])
  );
  const writtenPaths = new Set();

  const writePage = (routePath, meta, imageUrl = defaultImage, cardType = 'summary_large_image') => {
    if (!routePath || routePath === '/') {
      return;
    }
    if (writtenPaths.has(routePath)) {
      return;
    }
    const html = buildRouteHtml(
      indexHtml,
      routePath,
      meta,
      siteName,
      baseUrl,
      cardType === 'summary_no_image' ? null : (imageUrl ?? defaultImage),
      cardType
    );
    writeHtmlForPath(routePath, html);
    writtenPaths.add(routePath);
  };

  for (const route of routes) {
    if (
      route.pattern === '/' ||
      route.pattern === '*' ||
      route.pattern.includes(':')
    ) {
      continue;
    }

    writePage(route.pattern, route.meta);
  }

  // Build a character slug-to-name map for use by other entity descriptions.
  const characterItems = readJsonArray('enUS/characters.json');
  const charSlugToName = new Map(
    characterItems
      .filter((c) => c.slug)
      .map((c) => [c.slug, c.name])
  );

  // Build a howlkin slug-to-qualityKey map for alliance embed icons.
  const howlkinItems = readJsonArray('enUS/howlkins.json');
  const howlkinQualityMap = new Map(
    howlkinItems
      .filter((h) => h.slug && h.quality)
      .map((h) => [h.slug, normalizeQualityKey(h.quality)])
  );

  const dynamicRouteConfigs = [
    {
      pattern: '/characters/:name',
      file: 'enUS/characters.json',
      cardType: 'summary_large_image',
      getName: (item) => item?.name,
      getSlug: (item) => item?.slug,
      getEntityImageUrl: (item) =>
        assetsBase && item?.slug
          ? `${assetsBase}character/${item.slug}/skins/default/portrait.png`
          : null,
      getDescription: (item, baseDescription) => {
        const title = item?.title ? `, ${item.title}` : '';
        return truncateText(
          `${item?.name ?? 'Character'}${title}. ${baseDescription}`
        );
      },
    },
    {
      pattern: '/artifacts/:name',
      file: 'enUS/artifacts.json',
      getName: (item) => item?.name,
      getSlug: (item) => item?.slug,
      getEntityImageUrl: (item) =>
        assetsBase && item?.slug
          ? `${assetsBase}artifacts/${item.slug}/artifact.png`
          : null,
      getDescription: (item, baseDescription) => {
        const lore = item?.lore ? truncateText(item.lore, 140) : '';
        return truncateText(
          `${item?.name ?? 'Artifact'} details. ${lore ? `${lore} ` : ''}${baseDescription}`
        );
      },
    },
    {
      pattern: '/noble-phantasms/:name',
      file: 'enUS/noble-phantasm.json',
      getName: (item) => item?.name,
      getSlug: (item) => item?.slug,
      getEntityImageUrl: (item) =>
        assetsBase && item?.slug
          ? `${assetsBase}noble_phantasm/${item.slug}.png`
          : null,
      getDescription: (item, baseDescription) => {
        const charName = item?.character_slug
          ? (charSlugToName.get(item.character_slug) ?? null)
          : null;
        const owner = charName ? `Linked character: ${charName}. ` : '';
        return truncateText(
          `${item?.name ?? 'Noble Phantasm'} details. ${owner}${baseDescription}`
        );
      },
    },
    {
      pattern: '/teams/:teamName',
      file: 'enUS/teams.json',
      getName: (item) => item?.name,
      getSlug: (item) => item?.slug,
      getDescription: (item, baseDescription) => {
        const teamDesc = item?.description
          ? `${truncateText(item.description, 140)} `
          : '';
        return truncateText(
          `${item?.name ?? 'Team'} composition guide. ${teamDesc}${baseDescription}`
        );
      },
    },
    {
      pattern: '/gear-sets/:setName',
      file: 'enUS/gear-sets.json',
      getName: (item) => item?.name,
      getSlug: (item) => item?.slug,
      getDescription: (item, baseDescription) => {
        const bonus = item?.bonus_description
          ? `Set bonus: ${truncateText(item.bonus_description, 120)}. `
          : '';
        return truncateText(
          `${item?.name ?? 'Gear Set'} details. ${bonus}${baseDescription}`
        );
      },
    },
    {
      pattern: '/wyrms/:name',
      file: 'enUS/wyrms.json',
      getName: (item) => item?.name,
      getSlug: (item) => item?.slug,
      getEntityImageUrl: (item) =>
        assetsBase && item?.slug
          ? `${assetsBase}wyrm/${item.slug}/portrait.png`
          : null,
      getDescription: (item, baseDescription) => {
        const desc = item?.description ? truncateText(item.description, 140) : '';
        return truncateText(
          `${item?.name ?? 'Wyrm'} — ${item?.phase ?? ''} ${item?.faction ?? ''}. ${desc ? `${desc} ` : ''}${baseDescription}`
        );
      },
    },
    {
      pattern: '/wyrmspells/:name',
      file: 'enUS/wyrmspells.json',
      getName: (item) => item?.name,
      getSlug: (item) => item?.slug,
      getEntityImageUrl: (item) =>
        assetsBase && item?.type && item?.slug
          ? `${assetsBase}wyrmspell/${normalizeTypeKey(item.type)}/${item.slug}.png`
          : null,
      getDescription: (item, baseDescription) => {
        const qualities = item?.qualities;
        const maxEffect =
          Array.isArray(qualities) && qualities.length > 0
            ? qualities[qualities.length - 1]?.effect
            : null;
        const effectSnippet = maxEffect ? truncateText(maxEffect, 120) : '';
        return truncateText(
          `${item?.name ?? 'Wyrmspell'} details. ${effectSnippet ? `${effectSnippet} ` : ''}${baseDescription}`
        );
      },
    },
    {
      pattern: '/howlkins/:allianceName',
      file: 'enUS/golden-alliances.json',
      getName: (item) => item?.name,
      getSlug: (item) => item?.slug,
      getEntityImageUrl: (item) => {
        if (!assetsBase) return null;
        const firstMemberSlug = item?.howlkins?.[0];
        if (!firstMemberSlug) return null;
        const qualityKey = howlkinQualityMap.get(firstMemberSlug);
        if (!qualityKey) return null;
        return `${assetsBase}howlkin/${qualityKey}/${firstMemberSlug}.png`;
      },
      getDescription: (item, baseDescription) => {
        const members =
          Array.isArray(item?.howlkins) && item.howlkins.length > 0
            ? `Members: ${item.howlkins.slice(0, 4).join(', ')}${item.howlkins.length > 4 ? ` and ${item.howlkins.length - 4} more` : ''}. `
            : '';
        return truncateText(
          `${item?.name ?? 'Golden Alliance'} details. ${members}${baseDescription}`
        );
      },
    },
  ];

  for (const config of dynamicRouteConfigs) {
    const baseMeta = routeMetaByPattern.get(config.pattern);
    if (!baseMeta) {
      continue;
    }

    const items = readJsonArray(config.file);

    for (const item of items) {
      const name = config.getName(item);
      const slug = config.getSlug(item) ?? toEntitySlug(name);
      if (!slug) {
        continue;
      }

      const routePath = config.pattern.replace(/:[^/]+$/, slug);
      const entityImageUrl = config.getEntityImageUrl?.(item) ?? null;
      const imageUrl = entityImageUrl ?? defaultImage;
      const cardType =
        config.cardType ??
        (entityImageUrl ? 'summary' : 'summary_large_image');
      const meta = {
        title: String(name ?? baseMeta.title),
        description: config.getDescription(item, baseMeta.description),
      };

      writePage(routePath, meta, imageUrl, cardType);
    }
  }

  const oracleScrollsMeta = routeMetaByPattern.get('/oracle-scrolls/:scrollName');
  if (oracleScrollsMeta) {
    const relicItems = readJsonArray('enUS/relic.json');
    const scrollsSeen = new Set();
    for (const item of relicItems) {
      const scrollName = item?.oracle_scroll;
      if (!scrollName) continue;
      const slug = toEntitySlug(scrollName);
      if (!slug || scrollsSeen.has(slug)) continue;
      scrollsSeen.add(slug);
      writePage(
        `/oracle-scrolls/${slug}`,
        {
          title: String(scrollName),
          description: truncateText(
            `${scrollName} oracle scroll. ${oracleScrollsMeta.description}`
          ),
        },
        null,
        'summary_no_image'
      );
    }
  }

  const fallbackMeta = routeMetaByPattern.get('*') ??
    routeMetaByPattern.get('/') ?? {
      title: siteName,
      description:
        'A comprehensive wiki for Dragon Traveler game information, characters, resources, and more.',
    };
  const notFoundHtml = buildRouteHtml(
    indexHtml,
    '/404',
    fallbackMeta,
    siteName,
    baseUrl,
    defaultImage
  );
  writeFileSync(path.join(distDir, '404.html'), notFoundHtml, 'utf-8');
}

writeRoutePages();
