import { ROUTE_META } from '@/constants/route-meta';

const SEARCH_PAGE_KEYWORDS: Record<string, string> = {
  '/artifacts': 'artifacts database relic equipment',
  '/characters': 'characters database hero heroes',
  '/gear': 'gear equipment set headgear chestplate bracers boots weapon accessory',
  '/noble-phantasms': 'noble phantasm noble phantasms database',
  '/relics': 'relics sanctuary fated legendary ritual vessel oracle scroll',
  '/resources': 'resources materials currency items',
  '/subclasses': 'subclasses class talents tier bonuses effects',
  '/howlkins': 'howlkins database pot howlkin refinement',
  '/status-effects': 'status effects buffs debuffs',
  '/wyrms': 'wyrms dragons dragon companions battle faction',
  '/wyrmspells': 'wyrmspells dragon spells magic',
  '/toolbox/faq': 'faq frequently asked questions help guide beginner',
  '/toolbox/beginner-qa': 'beginner guide faq help tutorial',
  '/toolbox/shovel-event': 'shovel event digging layers efficiency bombs rockets',
  '/toolbox/star-upgrade-calculator': 'calculator star upgrade cost',
  '/toolbox/mythic-summon-calculator':
    'mythic summon calculator pull rates rewards pity simulation',
  '/toolbox/diamond-calculator':
    'diamond calculator income spending budget projection',
  '/tier-list': 'tier list ranking meta best',
  '/teams': 'teams compositions squad party',
  '/codes': 'codes redeem rewards gifts',
  '/events': 'events special event in-game limited time active',
  '/toolbox/useful-links': 'links resources tools external',
};

export const SEARCH_PAGES = Object.entries(SEARCH_PAGE_KEYWORDS).map(
  ([path, keywords]) => {
    const route = ROUTE_META.find((entry) => entry.pattern === path);
    if (!route) {
      throw new Error(`Search page has no matching route metadata: ${path}`);
    }
    return { title: route.meta.title, path, keywords };
  }
);
