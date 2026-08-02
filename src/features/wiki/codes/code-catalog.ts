import type { Code } from '@/features/wiki/codes/types';
import { isCodeActive, isCodeExpired } from '@/utils';

export type CodeView = 'unredeemed' | 'redeemed' | 'all';
export type CodeTab = 'active' | 'expired';

export function aggregateCodeRewards(codes: Code[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const code of codes) {
    for (const [slug, quantity] of Object.entries(code.rewards ?? {})) {
      totals.set(slug, (totals.get(slug) ?? 0) + quantity);
    }
  }
  return totals;
}

export function getTabCodes(codes: Code[], tab: CodeTab): Code[] {
  return codes.filter(tab === 'active' ? isCodeActive : isCodeExpired);
}

export function filterCodes(
  codes: Code[],
  tab: CodeTab,
  view: CodeView,
  redeemed: Set<string>,
  search: string
): Code[] {
  const normalizedSearch = search.trim().toLowerCase();
  return getTabCodes(codes, tab).filter((entry) => {
    if (view === 'redeemed' && !redeemed.has(entry.code)) return false;
    if (view === 'unredeemed' && redeemed.has(entry.code)) return false;
    return !normalizedSearch || entry.code.toLowerCase().includes(normalizedSearch);
  });
}

export function getCodeEmptyState(
  tab: CodeTab,
  view: CodeView,
  search: string
) {
  if (search) {
    return {
      title: 'No matching codes',
      message: `No ${tab} codes match "${search}" for the current ${view} filter.`,
    };
  }
  if (tab === 'expired') {
    return {
      title: 'No expired codes',
      message:
        view === 'redeemed'
          ? 'There are no expired codes marked as redeemed yet.'
          : view === 'unredeemed'
            ? 'There are no expired codes left in unredeemed view.'
            : 'No expired codes are available right now.',
    };
  }
  return {
    title: 'No active codes',
    message:
      view === 'redeemed'
        ? 'There are no active redeemed codes right now.'
        : view === 'unredeemed'
          ? 'All active codes are already redeemed.'
          : 'No active codes are available right now.',
  };
}
