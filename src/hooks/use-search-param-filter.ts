import { useEffect, type Dispatch, type SetStateAction } from 'react';
import { useSearchParams } from 'react-router';

/** Applies a global-search destination query without replacing saved filters. */
export function useSearchParamFilter<F extends { search: string }>(
  setFilters: Dispatch<SetStateAction<F>>,
) {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('search');

  useEffect(() => {
    if (search === null) return;
    setFilters((current) =>
      current.search === search ? current : { ...current, search },
    );
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('search');
    setSearchParams(nextParams, { replace: true });
  }, [search, searchParams, setFilters, setSearchParams]);
}

export function useSearchParamText(setValue: Dispatch<SetStateAction<string>>) {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('search');

  useEffect(() => {
    if (search === null) return;
    setValue((current) => (current === search ? current : search));
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('search');
    setSearchParams(nextParams, { replace: true });
  }, [search, searchParams, setSearchParams, setValue]);
}
