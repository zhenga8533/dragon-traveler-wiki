import { useEffect, type Dispatch, type SetStateAction } from 'react';
import { useSearchParams } from 'react-router-dom';

/** Applies a global-search destination query without replacing saved filters. */
export function useSearchParamFilter<F extends { search: string }>(
  setFilters: Dispatch<SetStateAction<F>>
) {
  const [searchParams] = useSearchParams();
  const search = searchParams.get('search');

  useEffect(() => {
    if (search === null) return;
    setFilters((current) =>
      current.search === search ? current : { ...current, search }
    );
  }, [search, setFilters]);
}

export function useSearchParamText(
  setValue: Dispatch<SetStateAction<string>>
) {
  const [searchParams] = useSearchParams();
  const search = searchParams.get('search');

  useEffect(() => {
    if (search === null) return;
    setValue((current) => (current === search ? current : search));
  }, [search, setValue]);
}
