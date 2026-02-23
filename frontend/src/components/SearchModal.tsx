import {
  ActionIcon,
  Box,
  Group,
  Kbd,
  Modal,
  Stack,
  Text,
  TextInput,
  UnstyledButton,
  useComputedColorScheme,
} from '@mantine/core';
import { useDisclosure, useHotkeys } from '@mantine/hooks';
import Fuse from 'fuse.js';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import type { IconType } from 'react-icons';
import {
  IoClose,
  IoDocumentTextOutline,
  IoFlashOutline,
  IoPeopleOutline,
  IoPersonOutline,
  IoSearch,
  IoSparklesOutline,
} from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import type { Artifact } from '../types/artifact';
import type { Character } from '../types/character';
import type { Code } from '../types/code';
import type { Gear } from '../types/gear';
import type { Howlkin } from '../types/howlkin';
import type { NoblePhantasm } from '../types/noble-phantasm';
import type { Resource } from '../types/resource';
import type { StatusEffect } from '../types/status-effect';
import type { Subclass } from '../types/subclass';
import type { Team } from '../types/team';
import type { TierList } from '../types/tier-list';
import type { UsefulLink } from '../types/useful-link';
import type { Wyrmspell } from '../types/wyrmspell';

type SearchResult = {
  type:
    | 'artifact'
    | 'character'
    | 'code'
    | 'gear'
    | 'howlkin'
    | 'resource'
    | 'status-effect'
    | 'subclass'
    | 'tier-list'
    | 'useful-link'
    | 'wyrmspell'
    | 'noble-phantasm'
    | 'team'
    | 'page';
  title: string;
  subtitle?: string;
  path: string;
  icon: IconType;
  color: string;
};

const PAGES = [
  {
    title: 'Artifacts',
    path: '/artifacts',
    keywords: 'artifacts database relic equipment',
  },
  {
    title: 'Characters',
    path: '/characters',
    keywords: 'characters database hero heroes',
  },
  {
    title: 'Gear',
    path: '/gear',
    keywords:
      'gear equipment set headgear chestplate bracers boots weapon accessory',
  },
  {
    title: 'Noble Phantasms',
    path: '/noble-phantasms',
    keywords: 'noble phantasm noble phantasms database',
  },
  {
    title: 'Resources',
    path: '/resources',
    keywords: 'resources materials currency items',
  },
  {
    title: 'Subclasses',
    path: '/subclasses',
    keywords: 'subclasses class talents tier bonuses effects',
  },
  {
    title: 'Howlkins',
    path: '/howlkins',
    keywords: 'howlkins database pot howlkin refinement',
  },
  {
    title: 'Status Effects',
    path: '/status-effects',
    keywords: 'status effects buffs debuffs',
  },
  {
    title: 'Wyrmspells',
    path: '/wyrmspells',
    keywords: 'wyrmspells dragon spells magic',
  },
  {
    title: 'Beginner Q&A',
    path: '/guides/beginner-qa',
    keywords: 'beginner guide faq help tutorial',
  },
  {
    title: 'Shovel Event Guide',
    path: '/guides/shovel-event',
    keywords: 'shovel event digging layers efficiency bombs rockets',
  },
  {
    title: 'Star Upgrade Calculator',
    path: '/guides/star-upgrade-calculator',
    keywords: 'calculator star upgrade cost',
  },
  {
    title: 'Tier List',
    path: '/tier-list',
    keywords: 'tier list ranking meta best',
  },
  {
    title: 'Teams',
    path: '/teams',
    keywords: 'teams compositions squad party',
  },
  { title: 'Codes', path: '/codes', keywords: 'codes redeem rewards gifts' },
  {
    title: 'Useful Links',
    path: '/useful-links',
    keywords: 'links resources tools external',
  },
  {
    title: 'Changelog',
    path: '/changelog',
    keywords: 'changelog updates patch notes changes',
  },
];

type SearchModalProps = {
  trigger?: (props: { open: () => void }) => ReactNode;
};

export default function SearchModal({ trigger }: SearchModalProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const [query, setQuery] = useState('');
  const [characters, setCharacters] = useState<Character[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [gear, setGear] = useState<Gear[]>([]);
  const [howlkins, setHowlkins] = useState<Howlkin[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [statusEffects, setStatusEffects] = useState<StatusEffect[]>([]);
  const [subclasses, setSubclasses] = useState<Subclass[]>([]);
  const [wyrmspells, setWyrmspells] = useState<Wyrmspell[]>([]);
  const [noblePhantasms, setNoblePhantasms] = useState<NoblePhantasm[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [codes, setCodes] = useState<Code[]>([]);
  const [usefulLinks, setUsefulLinks] = useState<UsefulLink[]>([]);
  const [tierLists, setTierLists] = useState<TierList[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const colorScheme = useComputedColorScheme('light');

  useHotkeys([
    ['mod+K', open],
    [
      '/',
      (e) => {
        e.preventDefault();
        open();
      },
    ],
  ]);

  useEffect(() => {
    if (opened) {
      const baseUrl = import.meta.env.BASE_URL || '/';

      const fetchJson = async <T,>(path: string): Promise<T[]> => {
        try {
          const response = await fetch(`${baseUrl}data/${path}`);
          if (!response.ok) return [];
          const data = (await response.json()) as T[];
          return Array.isArray(data) ? data : [];
        } catch {
          return [];
        }
      };

      Promise.all([
        fetchJson<Character>('characters.json'),
        fetchJson<Artifact>('artifacts.json'),
        fetchJson<Gear>('gear.json'),
        fetchJson<Howlkin>('howlkins.json'),
        fetchJson<Resource>('resources.json'),
        fetchJson<StatusEffect>('status-effects.json'),
        fetchJson<Subclass>('subclasses.json'),
        fetchJson<Wyrmspell>('wyrmspells.json'),
        fetchJson<NoblePhantasm>('noble_phantasm.json'),
        fetchJson<Team>('teams.json'),
        fetchJson<Code>('codes.json'),
        fetchJson<UsefulLink>('useful-links.json'),
        fetchJson<TierList>('tier-lists.json'),
      ])
        .then(
          ([
            chars,
            artifactsData,
            gearData,
            howlkinsData,
            resourcesData,
            effects,
            subclassesData,
            spells,
            phantasms,
            teamData,
            codesData,
            usefulLinksData,
            tierListsData,
          ]) => {
            setCharacters(chars);
            setArtifacts(artifactsData);
            setGear(gearData);
            setHowlkins(howlkinsData);
            setResources(resourcesData);
            setStatusEffects(effects);
            setSubclasses(subclassesData);
            setWyrmspells(spells);
            setNoblePhantasms(phantasms);
            setTeams(teamData);
            setCodes(codesData);
            setUsefulLinks(usefulLinksData);
            setTierLists(tierListsData);
          }
        )
        .catch((err) => {
          console.error('Failed to fetch search data:', err);
        });
    }
  }, [opened]);

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];

    const results: SearchResult[] = [];

    // Search characters (prioritize these)
    if (characters.length > 0) {
      const charFuse = new Fuse(characters, {
        keys: [
          { name: 'name', weight: 2 },
          { name: 'character_class', weight: 0.5 },
          { name: 'factions', weight: 0.3 },
          { name: 'subclasses', weight: 0.3 },
        ],
        threshold: 0.3,
        includeScore: true,
      });
      const charResults = charFuse.search(query).slice(0, 8);
      results.push(
        ...charResults.map((r) => ({
          type: 'character' as const,
          title: r.item.name,
          subtitle: `${r.item.quality} ${r.item.character_class}`,
          path: `/characters/${encodeURIComponent(r.item.name)}`,
          icon: IoPersonOutline,
          color: 'blue',
        }))
      );
    }

    // Search artifacts
    if (artifacts.length > 0) {
      const artifactFuse = new Fuse(artifacts, {
        keys: [
          'name',
          'quality',
          'lore',
          'effect.description',
          'treasures.name',
        ],
        threshold: 0.3,
      });
      const artifactResults = artifactFuse.search(query).slice(0, 5);
      results.push(
        ...artifactResults.map((r) => ({
          type: 'artifact' as const,
          title: r.item.name,
          subtitle: `${r.item.quality} Artifact`,
          path: `/artifacts/${encodeURIComponent(r.item.name)}`,
          icon: IoSparklesOutline,
          color: 'yellow',
        }))
      );
    }

    // Search gear
    if (gear.length > 0) {
      const gearFuse = new Fuse(gear, {
        keys: ['name', 'set', 'type', 'lore'],
        threshold: 0.3,
      });
      const gearResults = gearFuse.search(query).slice(0, 5);
      results.push(
        ...gearResults.map((r) => ({
          type: 'gear' as const,
          title: r.item.name,
          subtitle: `${r.item.type} • ${r.item.set}`,
          path: `/gear-sets/${encodeURIComponent(r.item.set)}`,
          icon: IoSparklesOutline,
          color: 'teal',
        }))
      );
    }

    // Search pages
    const pageFuse = new Fuse(PAGES, {
      keys: ['title', 'keywords'],
      threshold: 0.4,
    });
    const pageResults = pageFuse.search(query).slice(0, 3);
    results.push(
      ...pageResults.map((r) => ({
        type: 'page' as const,
        title: r.item.title,
        path: r.item.path,
        icon: IoDocumentTextOutline,
        color: 'gray',
      }))
    );

    // Search status effects
    if (statusEffects.length > 0) {
      const effectFuse = new Fuse(statusEffects, {
        keys: ['name', 'type', 'effect'],
        threshold: 0.3,
      });
      const effectResults = effectFuse.search(query).slice(0, 5);
      results.push(
        ...effectResults.map((r) => ({
          type: 'status-effect' as const,
          title: r.item.name,
          subtitle: r.item.type,
          path: '/status-effects',
          icon: IoFlashOutline,
          color: 'orange',
        }))
      );
    }

    // Search subclasses
    if (subclasses.length > 0) {
      const subclassFuse = new Fuse(subclasses, {
        keys: ['name', 'class', 'effect', 'bonuses'],
        threshold: 0.3,
      });
      const subclassResults = subclassFuse.search(query).slice(0, 5);
      results.push(
        ...subclassResults.map((r) => ({
          type: 'subclass' as const,
          title: r.item.name,
          subtitle: `${r.item.class} • Tier ${r.item.tier}`,
          path: '/subclasses',
          icon: IoSparklesOutline,
          color: 'grape',
        }))
      );
    }

    // Search wyrmspells
    if (wyrmspells.length > 0) {
      const spellFuse = new Fuse(wyrmspells, {
        keys: ['name', 'type', 'effect'],
        threshold: 0.3,
      });
      const spellResults = spellFuse.search(query).slice(0, 5);
      results.push(
        ...spellResults.map((r) => ({
          type: 'wyrmspell' as const,
          title: r.item.name,
          subtitle: r.item.type,
          path: '/wyrmspells',
          icon: IoSparklesOutline,
          color: 'violet',
        }))
      );
    }

    // Search teams
    if (teams.length > 0) {
      const teamFuse = new Fuse(teams, {
        keys: ['name', 'description', 'members.character_name'],
        threshold: 0.3,
      });
      const teamResults = teamFuse.search(query).slice(0, 3);
      results.push(
        ...teamResults.map((r) => ({
          type: 'team' as const,
          title: r.item.name,
          subtitle: `${r.item.members.length} characters`,
          path: '/teams',
          icon: IoPeopleOutline,
          color: 'green',
        }))
      );
    }

    // Search howlkins
    if (howlkins.length > 0) {
      const howlkinFuse = new Fuse(howlkins, {
        keys: ['name', 'quality', 'passive_effects'],
        threshold: 0.3,
      });
      const howlkinResults = howlkinFuse.search(query).slice(0, 4);
      results.push(
        ...howlkinResults.map((r) => ({
          type: 'howlkin' as const,
          title: r.item.name,
          subtitle: `${r.item.quality} Howlkin`,
          path: '/howlkins',
          icon: IoPeopleOutline,
          color: 'teal',
        }))
      );
    }

    // Search noble phantasms
    if (noblePhantasms.length > 0) {
      const npFuse = new Fuse(noblePhantasms, {
        keys: ['name', 'character', 'lore'],
        threshold: 0.3,
      });
      const npResults = npFuse.search(query).slice(0, 5);
      results.push(
        ...npResults.map((r) => ({
          type: 'noble-phantasm' as const,
          title: r.item.name,
          subtitle: r.item.character || 'Noble Phantasm',
          path: `/noble-phantasms/${encodeURIComponent(r.item.name)}`,
          icon: IoSparklesOutline,
          color: 'grape',
        }))
      );
    }

    // Search resources
    if (resources.length > 0) {
      const resourceFuse = new Fuse(resources, {
        keys: ['name', 'description', 'category', 'quality'],
        threshold: 0.3,
      });
      const resourceResults = resourceFuse.search(query).slice(0, 5);
      results.push(
        ...resourceResults.map((r) => ({
          type: 'resource' as const,
          title: r.item.name,
          subtitle: `${r.item.category} • ${r.item.quality}`,
          path: '/resources',
          icon: IoSparklesOutline,
          color: 'lime',
        }))
      );
    }

    // Search codes
    if (codes.length > 0) {
      const codeFuse = new Fuse(codes, {
        keys: ['code'],
        threshold: 0.25,
      });
      const codeResults = codeFuse.search(query).slice(0, 4);
      results.push(
        ...codeResults.map((r) => ({
          type: 'code' as const,
          title: r.item.code,
          subtitle: r.item.active ? 'Active code' : 'Inactive code',
          path: '/codes',
          icon: IoFlashOutline,
          color: 'cyan',
        }))
      );
    }

    // Search useful links
    if (usefulLinks.length > 0) {
      const linksFuse = new Fuse(usefulLinks, {
        keys: ['application', 'name', 'description', 'link'],
        threshold: 0.3,
      });
      const linkResults = linksFuse.search(query).slice(0, 4);
      results.push(
        ...linkResults.map((r) => ({
          type: 'useful-link' as const,
          title: r.item.name,
          subtitle: r.item.application,
          path: '/useful-links',
          icon: IoDocumentTextOutline,
          color: 'indigo',
        }))
      );
    }

    // Search tier lists
    if (tierLists.length > 0) {
      const tierListFuse = new Fuse(tierLists, {
        keys: [
          'name',
          'author',
          'content_type',
          'description',
          'entries.character_name',
        ],
        threshold: 0.3,
      });
      const tierListResults = tierListFuse.search(query).slice(0, 3);
      results.push(
        ...tierListResults.map((r) => ({
          type: 'tier-list' as const,
          title: r.item.name,
          subtitle: `${r.item.content_type} • ${r.item.author}`,
          path: '/tier-list',
          icon: IoDocumentTextOutline,
          color: 'pink',
        }))
      );
    }

    return results.slice(0, 12);
  }, [
    query,
    characters,
    artifacts,
    gear,
    howlkins,
    resources,
    statusEffects,
    subclasses,
    wyrmspells,
    noblePhantasms,
    teams,
    codes,
    usefulLinks,
    tierLists,
  ]);

  useEffect(() => {
    queueMicrotask(() => {
      setSelectedIndex(0);
    });
  }, [searchResults]);

  const handleSelect = (result: SearchResult) => {
    navigate(result.path);
    close();
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (searchResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => (i + 1) % searchResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(
        (i) => (i - 1 + searchResults.length) % searchResults.length
      );
    } else if (e.key === 'Enter' && searchResults[selectedIndex]) {
      e.preventDefault();
      handleSelect(searchResults[selectedIndex]);
    }
  };

  return (
    <>
      {trigger ? (
        trigger({ open })
      ) : (
        <ActionIcon
          variant="subtle"
          size="lg"
          onClick={open}
          aria-label="Search"
        >
          <IoSearch size={18} />
        </ActionIcon>
      )}

      <Modal
        opened={opened}
        onClose={() => {
          close();
          setQuery('');
        }}
        title={null}
        size="600px"
        padding={0}
        withCloseButton={false}
        centered
        radius="md"
        styles={{
          body: { padding: 0 },
          content: {
            overflow: 'hidden',
          },
          inner: {
            padding: '0 16px',
          },
        }}
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
      >
        <Box>
          <Box
            p="md"
            style={{
              borderBottom:
                colorScheme === 'dark'
                  ? '1px solid #373A40'
                  : '1px solid #dee2e6',
            }}
          >
            <TextInput
              placeholder="Search all wiki content..."
              value={query}
              onChange={(e) => setQuery(e.currentTarget.value)}
              onKeyDown={handleKeyDown}
              leftSection={<IoSearch size={18} />}
              rightSection={
                query ? (
                  <ActionIcon
                    variant="subtle"
                    onClick={() => setQuery('')}
                    size="sm"
                    color="gray"
                  >
                    <IoClose size={16} />
                  </ActionIcon>
                ) : (
                  <Kbd size="sm">⌘K</Kbd>
                )
              }
              styles={{
                input: {
                  border: 'none',
                  fontSize: '15px',
                },
              }}
              autoFocus
              size="md"
            />
          </Box>

          {query && searchResults.length === 0 && (
            <Box p="xl" ta="center">
              <Text c="dimmed" size="sm">
                No results found for "{query}"
              </Text>
            </Box>
          )}

          {searchResults.length > 0 && (
            <Stack gap={0} style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {searchResults.map((result, index) => {
                const Icon = result.icon;
                const isSelected = index === selectedIndex;
                return (
                  <UnstyledButton
                    key={`${result.type}-${result.title}-${index}`}
                    onClick={() => handleSelect(result)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    p="md"
                    style={{
                      display: 'block',
                      width: '100%',
                      backgroundColor: isSelected
                        ? colorScheme === 'dark'
                          ? '#2C2E33'
                          : '#f8f9fa'
                        : 'transparent',
                      transition: 'background-color 0.1s',
                    }}
                  >
                    <Group wrap="nowrap" gap="md">
                      <Box
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: `var(--mantine-color-${result.color}-1)`,
                        }}
                      >
                        <Icon
                          size={20}
                          color={`var(--mantine-color-${result.color}-6)`}
                        />
                      </Box>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Text size="sm" fw={500} truncate>
                          {result.title}
                        </Text>
                        {result.subtitle && (
                          <Text size="xs" c="dimmed" truncate>
                            {result.subtitle}
                          </Text>
                        )}
                      </div>
                      {isSelected && (
                        <Text size="xs" c="dimmed">
                          <Kbd size="xs">↵</Kbd>
                        </Text>
                      )}
                    </Group>
                  </UnstyledButton>
                );
              })}
            </Stack>
          )}

          {!query && (
            <Box p="xl" ta="center">
              <Text c="dimmed" size="sm">
                Search artifacts, characters, howlkins, resources, status
                effects, wyrmspells, teams, codes, tier lists, links, and pages
              </Text>
              <Group justify="center" gap="xs" mt="md">
                <Text size="xs" c="dimmed">
                  Navigate with
                </Text>
                <Kbd size="xs">↑</Kbd>
                <Kbd size="xs">↓</Kbd>
              </Group>
            </Box>
          )}
        </Box>
      </Modal>
    </>
  );
}
