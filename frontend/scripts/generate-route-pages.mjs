import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const distDir = path.resolve(projectRoot, 'dist');
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

  for (const route of routes) {
    if (
      route.pattern === '/' ||
      route.pattern === '*' ||
      route.pattern.includes(':')
    ) {
      continue;
    }

    const normalized = route.pattern.replace(/^\//, '');
    const html = buildRouteHtml(
      indexHtml,
      route.pattern,
      route.meta,
      siteName,
      baseUrl,
      defaultImage
    );

    const flatPath = path.join(distDir, `${normalized}.html`);
    const nestedDir = path.join(distDir, normalized);
    const nestedIndexPath = path.join(nestedDir, 'index.html');

    mkdirSync(path.dirname(flatPath), { recursive: true });
    mkdirSync(nestedDir, { recursive: true });

    writeFileSync(flatPath, html, 'utf-8');
    writeFileSync(nestedIndexPath, html, 'utf-8');
  }

  writeFileSync(path.join(distDir, '404.html'), indexHtml, 'utf-8');
}

writeRoutePages();
