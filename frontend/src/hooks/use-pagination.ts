import { useState, type Dispatch, type SetStateAction } from 'react';

export function usePagination(
  total: number,
  pageSize: number,
  filterKey: string
) {
  const [paginationState, setPaginationState] = useState({
    key: filterKey,
    page: 1,
  });

  const page = paginationState.key === filterKey ? paginationState.page : 1;

  const setPage: Dispatch<SetStateAction<number>> = (value) => {
    setPaginationState((prev) => {
      const currentPage = prev.key === filterKey ? prev.page : 1;
      const nextPage =
        typeof value === 'function'
          ? (value as (prevState: number) => number)(currentPage)
          : value;
      return {
        key: filterKey,
        page: nextPage,
      };
    });
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const effectivePage = Math.min(page, totalPages); // clamp if filters narrow results
  const offset = (effectivePage - 1) * pageSize;
  return { page: effectivePage, setPage, totalPages, offset };
}
