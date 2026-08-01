import { ROUTE_CATALOG } from '@/constants/route-meta';

export const SEARCH_PAGES = ROUTE_CATALOG.flatMap((route) =>
  'searchKeywords' in route
    ? [
        {
          title: route.meta.title,
          path: route.pattern,
          keywords: route.searchKeywords,
        },
      ]
    : []
);
