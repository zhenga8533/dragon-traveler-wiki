interface RankableSearchResult {
  type: string;
  title: string;
}

function titleMatchRank(title: string, query: string) {
  const normalizedTitle = title.trim().toLocaleLowerCase();
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (normalizedTitle === normalizedQuery) return 0;
  if (normalizedTitle.startsWith(normalizedQuery)) return 1;
  if (normalizedTitle.includes(normalizedQuery)) return 2;
  return 3;
}

export function rankAndLimitSearchResults<T extends RankableSearchResult>(
  results: readonly T[],
  query: string,
  limit: number,
) {
  const groups = new Map<string, T[]>();
  for (const result of results) {
    const group = groups.get(result.type) ?? [];
    group.push(result);
    groups.set(result.type, group);
  }

  return [...groups.values()]
    .map((group) =>
      group.sort(
        (a, b) =>
          titleMatchRank(a.title, query) - titleMatchRank(b.title, query),
      ),
    )
    .sort(
      (a, b) =>
        titleMatchRank(a[0].title, query) - titleMatchRank(b[0].title, query),
    )
    .flat()
    .slice(0, limit);
}
