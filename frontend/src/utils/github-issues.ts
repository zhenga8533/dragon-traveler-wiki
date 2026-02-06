import { GITHUB_REPO_URL } from '../constants';

export function buildIssueUrl(params: {
  title: string;
  body: string;
  labels: string;
}): string {
  return `${GITHUB_REPO_URL}/issues/new?${new URLSearchParams(params).toString()}`;
}

// JSON templates for suggestion modals
export const CHARACTER_JSON_TEMPLATE = {
  name: '',
  quality: 'SSR | SSR+ | SR+ | R | N',
  character_class: 'Guardian | Priest | Assassin | Warrior | Archer | Mage',
  factions: ['Faction1', 'Faction2'],
  is_global: true,
  additional_info: '(optional notes)',
};

export const TIER_LIST_JSON_TEMPLATE = {
  name: 'Tier List Name',
  author: 'Your Name',
  content_type: 'e.g. PvE, PvP',
  description: 'Brief description of this tier list',
  entries: [
    { character_name: 'Character1', tier: 'S+' },
    { character_name: 'Character2', tier: 'S' },
    { character_name: 'Character3', tier: 'A' },
  ],
};

export const CODE_JSON_TEMPLATE = {
  code: 'PASTE_CODE_HERE',
  source: '(optional) Where did you find this code?',
};

export const WYRMSPELL_JSON_TEMPLATE = {
  name: 'Wyrmspell Name',
  type: 'Breach | Refuge | (other)',
  effect: 'Describe the effect clearly',
};

export const LINK_JSON_TEMPLATE = {
  icon: 'discord | wiki | spreadsheet | (leave empty for generic)',
  application: 'e.g. Discord, Google Sheets, Website',
  name: 'Link Name',
  description: 'Brief description of what this link provides',
  link: 'https://example.com',
};

export const TEAM_JSON_TEMPLATE = {
  name: 'Team Name',
  author: 'Your Name',
  content_type: 'e.g. PvP, PvE, Boss',
  description: 'Brief description of this team composition',
  faction:
    'Elemental Echo | Wild Spirit | Arcane Wisdom | Sanctum Glory | Otherworld Return | Illusion Veil',
  members: [
    { character_name: 'Character1', overdrive_order: 1 },
    { character_name: 'Character2', overdrive_order: 2 },
    { character_name: 'Character3', overdrive_order: null },
    { character_name: 'Character4', overdrive_order: null },
  ],
};

// Keep the expired code URL builder for the inline action
export function buildExpiredCodeUrl(code: string): string {
  return buildIssueUrl({
    title: `[Code] Report expired: ${code}`,
    body: `The code \`${code}\` appears to be expired or no longer working.\n`,
    labels: 'codes',
  });
}
