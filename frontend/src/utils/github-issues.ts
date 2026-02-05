import { GITHUB_REPO_URL } from '../constants';

export function buildIssueUrl(params: { title: string; body: string; labels: string }): string {
  return `${GITHUB_REPO_URL}/issues/new?${new URLSearchParams(params).toString()}`;
}

export const CHARACTER_SUGGEST_URL = buildIssueUrl({
  title: '[Character] New character suggestion',
  body: [
    '**Character Name:**',
    '',
    '**Quality:**',
    '',
    '**Class:**',
    '',
    '**Factions:**',
    '',
    '**Additional Info (optional):**',
    '',
  ].join('\n'),
  labels: 'character',
});

export const TIER_LIST_SUGGEST_URL = buildIssueUrl({
  title: '[Tier List] New tier list suggestion',
  body: [
    '**Category** (e.g. PvE, PvP):',
    '',
    '**JSON Data:**',
    '',
    '**Reasoning (optional):**',
    '',
  ].join('\n'),
  labels: 'tier-list',
});

export const CODE_SUGGEST_URL = buildIssueUrl({
  title: '[Code] New code suggestion',
  body: '**Code:**\n`PASTE_CODE_HERE`\n\n**Source (optional):**\nWhere did you find this code?\n',
  labels: 'codes',
});

export function buildExpiredCodeUrl(code: string): string {
  return buildIssueUrl({
    title: `[Code] Report expired: ${code}`,
    body: `The code \`${code}\` appears to be expired or no longer working.\n`,
    labels: 'codes',
  });
}

export const LINK_SUGGEST_URL = buildIssueUrl({
  title: '[Link] New link suggestion',
  body: '**Name:**\n\n**URL:**\n\n**Description:**\n',
  labels: 'links',
});
