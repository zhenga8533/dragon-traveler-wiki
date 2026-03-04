import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const distDir = path.resolve(projectRoot, 'dist');
const dataDir = path.resolve(projectRoot, '../data');
const routeMetaPath = path.resolve(projectRoot, 'src/constants/route-meta.ts');
const indexHtmlPath = path.join(distDir, 'index.html');

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
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function normalizeQualitySuffix(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_+]/g, '')
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
    /\{\s*pattern:\s*'([^']+)'\s*,\s*meta:\s*\{\s*title:\s*'([^']+)'\s*,\s*description:\s*'([\s\S]*?)'\s*,?\s*\}\s*,?\s*\}/g;

  const routes = [];
  let match;
  while ((match = entryRegex.exec(routeMetaChunk)) !== null) {
    routes.push({
      pattern: match[1],
      meta: {
        title: match[2],
        description: match[3].replace(/\s+/g, ' ').trim(),
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

function replaceFirstMeta(html, attr, key, value) {
  const pattern = new RegExp(
    `<meta\\s+${attr}=["']${escapeRegExp(key)}["']\\s+content=["'][^"']*["']\\s*\\/?>`,
    'i'
  );
  const replacement = `<meta ${attr}="${key}" content="${escapeHtml(value)}" />`;
  return html.replace(pattern, replacement);
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
  imageUrl
) {
  const pageTitle =
    meta.title === siteName ? siteName : `${meta.title} | ${siteName}`;
  const pageUrl = `${baseUrl}${routePath}`;

  let html = indexHtml.replace(
    /<title>[\s\S]*?<\/title>/i,
    `<title>${escapeHtml(pageTitle)}</title>`
  );
  html = replaceFirstMeta(html, 'name', 'description', meta.description);
  html = replaceFirstMeta(html, 'property', 'og:title', pageTitle);
  html = replaceFirstMeta(html, 'property', 'og:description', meta.description);
  html = replaceFirstMeta(html, 'property', 'og:url', pageUrl);
  html = replaceFirstMeta(html, 'name', 'twitter:title', pageTitle);
  html = replaceFirstMeta(
    html,
    'name',
    'twitter:description',
    meta.description
  );

  if (imageUrl) {
    html = replaceFirstMeta(html, 'property', 'og:image', imageUrl);
    html = replaceFirstMeta(html, 'name', 'twitter:image', imageUrl);
    html = replaceFirstMeta(
      html,
      'name',
      'twitter:card',
      'summary_large_image'
    );
  } else {
    html = removeMeta(html, 'property', 'og:image');
    html = removeMeta(html, 'name', 'twitter:image');
    html = replaceFirstMeta(html, 'name', 'twitter:card', 'summary');
  }

  return html;
}

function getCharacterDefaultIllustrationRelativePath(characterSlug) {
  const extensionCandidates = ['png', 'jpg', 'jpeg', 'webp'];
  for (const extension of extensionCandidates) {
    const sourcePath = path.join(
      projectRoot,
      'src',
      'assets',
      'character',
      characterSlug,
      'illustrations',
      `default.${extension}`
    );

    if (!existsSync(sourcePath)) {
      continue;
    }

    const destinationDir = path.join(distDir, 'character-illustrations');
    const destinationFileName = `${characterSlug}.${extension}`;
    const destinationPath = path.join(destinationDir, destinationFileName);
    mkdirSync(destinationDir, { recursive: true });
    copyFileSync(sourcePath, destinationPath);
    return `/character-illustrations/${destinationFileName}`;
  }

  return null;
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

  const writePage = (routePath, meta, imageUrl = null) => {
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
      imageUrl
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

  const dynamicRouteConfigs = [
    {
      pattern: '/characters/:name',
      file: 'characters.json',
      getName: (item) => item?.name,
      getDescription: (item, baseDescription) => {
        const title = item?.title ? `, ${item.title}` : '';
        return truncateText(
          `${item?.name ?? 'Character'}${title}. ${baseDescription}`
        );
      },
    },
    {
      pattern: '/artifacts/:name',
      file: 'artifacts.json',
      getName: (item) => item?.name,
      getDescription: (item, baseDescription) => {
        const lore = item?.lore ? truncateText(item.lore, 140) : '';
        return truncateText(
          `${item?.name ?? 'Artifact'} details. ${lore ? `${lore} ` : ''}${baseDescription}`
        );
      },
    },
    {
      pattern: '/noble-phantasms/:name',
      file: 'noble_phantasm.json',
      getName: (item) => item?.name,
      getDescription: (item, baseDescription) => {
        const owner = item?.character
          ? `Linked character: ${item.character}. `
          : '';
        return truncateText(
          `${item?.name ?? 'Noble Phantasm'} details. ${owner}${baseDescription}`
        );
      },
    },
    {
      pattern: '/teams/:teamName',
      file: 'teams.json',
      getName: (item) => item?.name,
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
      file: 'gear_sets.json',
      getName: (item) => item?.name,
      getDescription: (item, baseDescription) => {
        const bonus = item?.set_bonus?.description
          ? `Set bonus: ${truncateText(item.set_bonus.description, 120)}. `
          : '';
        return truncateText(
          `${item?.name ?? 'Gear Set'} details. ${bonus}${baseDescription}`
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
    const characterNameCounts =
      config.pattern === '/characters/:name'
        ? (() => {
            const counts = new Map();
            for (const item of items) {
              const baseSlug = toEntitySlug(config.getName(item));
              if (!baseSlug) continue;
              counts.set(baseSlug, (counts.get(baseSlug) ?? 0) + 1);
            }
            return counts;
          })()
        : null;
    const characterBasePagesWritten = new Set();

    for (const item of items) {
      const name = config.getName(item);
      const baseSlug = toEntitySlug(name);
      if (!baseSlug) {
        continue;
      }

      let slug = baseSlug;
      if (config.pattern === '/characters/:name') {
        const hasMultipleRarities =
          (characterNameCounts?.get(baseSlug) ?? 0) > 1;
        if (hasMultipleRarities) {
          const qualitySuffix = normalizeQualitySuffix(item?.quality);
          slug = qualitySuffix ? `${baseSlug}_${qualitySuffix}` : baseSlug;

          if (!characterBasePagesWritten.has(baseSlug)) {
            characterBasePagesWritten.add(baseSlug);
            writePage(`/characters/${baseSlug}`, {
              title: String(name ?? baseMeta.title),
              description: truncateText(
                `${name ?? 'Character'} has multiple rarities. Open this page to choose a rarity-specific build and detail page.`
              ),
            });
          }
        }
      }

      const routePath = config.pattern.replace(/:[^/]+$/, slug);
      const imageUrl =
        config.pattern === '/characters/:name'
          ? (() => {
              const relativePath =
                getCharacterDefaultIllustrationRelativePath(slug);
              return relativePath ? `${baseUrl}${relativePath}` : null;
            })()
          : null;
      const meta = {
        title: String(name ?? baseMeta.title),
        description: config.getDescription(item, baseMeta.description),
      };

      writePage(routePath, meta, imageUrl);
    }
  }

  const gearSetsMeta = routeMetaByPattern.get('/gear-sets/:setName');
  if (gearSetsMeta) {
    const gearItems = readJsonArray('gear.json');
    const setNames = new Set();
    for (const item of gearItems) {
      const setName = item?.set;
      const slug = toEntitySlug(setName);
      if (!slug || setNames.has(slug)) {
        continue;
      }
      setNames.add(slug);
      writePage(`/gear-sets/${slug}`, {
        title: String(setName ?? gearSetsMeta.title),
        description: truncateText(
          `${setName ?? 'Gear Set'} details. ${gearSetsMeta.description}`
        ),
      });
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
    null
  );
  writeFileSync(path.join(distDir, '404.html'), notFoundHtml, 'utf-8');
}

writeRoutePages();
