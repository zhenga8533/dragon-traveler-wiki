import { useRef, useState } from 'react';

export function usePagination(total: number, pageSize: number, filterKey: string) {
  const [page, setPage] = useState(1);
  const prevKey = useRef(filterKey);

  // Synchronously reset page during render when filter state changes
  if (prevKey.current !== filterKey) {
    prevKey.current = filterKey;
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const effectivePage = Math.min(page, totalPages); // clamp if filters narrow results
  const offset = (effectivePage - 1) * pageSize;
  return { page: effectivePage, setPage, totalPages, offset };
}
