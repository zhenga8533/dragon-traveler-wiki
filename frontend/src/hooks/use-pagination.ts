import { useState, type Dispatch, type SetStateAction } from 'react';

function clampPage(page: number, totalPages: number) {
  return Math.min(Math.max(1, page), totalPages);
}

export function usePagination(
  total: number,
  pageSize: number,
  filterKey: string
) {
  const safeTotal = Number.isFinite(total) ? Math.max(0, total) : 0;
  const safePageSize =
    Number.isFinite(pageSize) && pageSize > 0 ? Math.floor(pageSize) : 1;
  const totalPages = Math.max(1, Math.ceil(safeTotal / safePageSize));

  const [paginationState, setPaginationState] = useState({
    key: filterKey,
    page: 1,
  });

  const page = paginationState.key === filterKey ? paginationState.page : 1;

  const setPage: Dispatch<SetStateAction<number>> = (value) => {
    setPaginationState((prev) => {
      const currentPage = prev.key === filterKey ? prev.page : 1;
      const nextPageRaw =
        typeof value === 'function'
          ? (value as (prevState: number) => number)(currentPage)
          : value;
      const nextPage = clampPage(nextPageRaw, totalPages);
      return {
        key: filterKey,
        page: nextPage,
      };
    });
  };

  const effectivePage = clampPage(page, totalPages);
  const offset = (effectivePage - 1) * safePageSize;
  return { page: effectivePage, setPage, totalPages, offset };
}
