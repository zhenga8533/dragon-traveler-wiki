import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
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
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '_')
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
  defaultImage
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
  html = replaceFirstMeta(html, 'property', 'og:image', defaultImage);
  html = replaceFirstMeta(html, 'name', 'twitter:title', pageTitle);
  html = replaceFirstMeta(
    html,
    'name',
    'twitter:description',
    meta.description
  );
  html = replaceFirstMeta(html, 'name', 'twitter:image', defaultImage);

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

  const writePage = (routePath, meta) => {
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
      defaultImage
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
    for (const item of items) {
      const name = config.getName(item);
      const slug = toEntitySlug(name);
      if (!slug) {
        continue;
      }

      const routePath = config.pattern.replace(/:[^/]+$/, slug);
      const meta = {
        title: String(name ?? baseMeta.title),
        description: config.getDescription(item, baseMeta.description),
      };

      writePage(routePath, meta);
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

  writeFileSync(path.join(distDir, '404.html'), indexHtml, 'utf-8');
}

writeRoutePages();
