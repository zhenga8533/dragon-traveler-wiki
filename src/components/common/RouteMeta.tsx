import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  BASE_URL,
  DEFAULT_DESCRIPTION,
  DEFAULT_IMAGE,
  DEFAULT_IMAGE_ALT,
  DEFAULT_IMAGE_HEIGHT,
  DEFAULT_IMAGE_WIDTH,
  ROUTE_META,
  getRouteMetaEntry,
  SITE_NAME,
  type RouteMeta as RouteMetaType,
} from '@/constants/route-meta';

function upsertMetaTag(
  attr: 'name' | 'property',
  key: string,
  content: string
): void {
  const selector = `meta[${attr}="${key}"]`;
  let meta = document.querySelector<HTMLMetaElement>(selector);

  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attr, key);
    document.head.appendChild(meta);
  }

  meta.setAttribute('content', content);
}

function getRouteMeta(pathname: string): RouteMetaType {
  const explicit = getRouteMetaEntry(pathname);

  if (explicit) {
    return explicit.meta;
  }

  const notFound = ROUTE_META.find(({ pattern }) => pattern === '*');

  return (
    notFound?.meta ?? {
      title: SITE_NAME,
      description: DEFAULT_DESCRIPTION,
    }
  );
}

export default function RouteMeta() {
  const { pathname } = useLocation();

  const routeMeta = useMemo(() => getRouteMeta(pathname), [pathname]);

  useEffect(() => {
    const pageTitle =
      routeMeta.title === SITE_NAME
        ? SITE_NAME
        : `${routeMeta.title} | ${SITE_NAME}`;
    const pageUrl = `${BASE_URL}${pathname}`;

    document.title = pageTitle;
    upsertMetaTag('name', 'description', routeMeta.description);

    upsertMetaTag('property', 'og:title', pageTitle);
    upsertMetaTag('property', 'og:description', routeMeta.description);
    upsertMetaTag('property', 'og:url', pageUrl);
    upsertMetaTag('property', 'og:type', 'website');
    upsertMetaTag('property', 'og:site_name', SITE_NAME);
    upsertMetaTag('property', 'og:image', DEFAULT_IMAGE);
    upsertMetaTag('property', 'og:image:width', DEFAULT_IMAGE_WIDTH);
    upsertMetaTag('property', 'og:image:height', DEFAULT_IMAGE_HEIGHT);
    upsertMetaTag('property', 'og:image:alt', DEFAULT_IMAGE_ALT);

    upsertMetaTag('name', 'twitter:card', 'summary_large_image');
    upsertMetaTag('name', 'twitter:title', pageTitle);
    upsertMetaTag('name', 'twitter:description', routeMeta.description);
    upsertMetaTag('name', 'twitter:image', DEFAULT_IMAGE);
    upsertMetaTag('name', 'twitter:image:alt', DEFAULT_IMAGE_ALT);
  }, [pathname, routeMeta]);

  return null;
}
