import {
  ActionIcon,
  Box,
  Group,
  Kbd,
  Modal,
  Stack,
  Text,
  TextInput,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import { useDebouncedValue, useDisclosure, useHotkeys } from '@mantine/hooks';
import Fuse from 'fuse.js';
import type { ReactNode } from 'react';
import { Fragment, useContext, useEffect, useMemo, useState } from 'react';
import type { IconType } from 'react-icons';
import {
  IoClose,
  IoCubeOutline,
  IoDiamondOutline,
  IoDocumentTextOutline,
  IoFlameOutline,
  IoFlashOutline,
  IoGridOutline,
  IoPawOutline,
  IoPeopleOutline,
  IoPersonOutline,
  IoSearch,
  IoShieldOutline,
  IoSparklesOutline,
} from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import { getArtifactIcon } from '../../assets/artifacts';
import { getGearIcon } from '../../assets/gear';
import { getHowlkinIcon } from '../../assets/howlkin';
import { getNoblePhantasmIcon } from '../../assets/noble_phantasm';
import { getResourceIcon } from '../../assets/resource';
import { getStatusEffectIcon } from '../../assets/status_effect';
import { getSubclassIcon } from '../../assets/subclass';
import { getWyrmspellIcon } from '../../assets/wyrmspell';
import { normalizeContentType } from '../../constants/content-types';
import { TRANSITION } from '../../constants/ui';
import { SearchDataContext } from '../../contexts';
import { isCodeActive } from '../../utils';
import CharacterPortrait from '../character/CharacterPortrait';

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
  icon: IconType | string;
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
    title: 'Mythic Summon Calculator',
    path: '/guides/mythic-summon-calculator',
    keywords: 'mythic summon calculator pull rates rewards pity simulation',
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
];

const CATEGORY_LABELS: Record<SearchResult['type'], string> = {
  artifact: 'Artifacts',
  character: 'Characters',
  code: 'Codes',
  gear: 'Gear',
  howlkin: 'Howlkins',
  'noble-phantasm': 'Noble Phantasms',
  resource: 'Resources',
  'status-effect': 'Status Effects',
  subclass: 'Subclasses',
  'tier-list': 'Tier Lists',
  'useful-link': 'Useful Links',
  wyrmspell: 'Wyrmspells',
  team: 'Teams',
  page: 'Pages',
};

interface SearchModalProps {
  trigger?: (props: { open: () => void }) => ReactNode;
  enableHotkeys?: boolean;
}

export default function SearchModal({
  trigger,
  enableHotkeys = true,
}: SearchModalProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebouncedValue(query, 150);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const {
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
  } = useContext(SearchDataContext);

  const searchShortcutHint = 'Search (/)';

  useHotkeys(
    enableHotkeys
      ? [
          [
            '/',
            (e) => {
              e.preventDefault();
              open();
            },
          ],
        ]
      : []
  );

  const searchResults = useMemo(() => {
    if (!debouncedQuery.trim()) return [];

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
      const charResults = charFuse.search(debouncedQuery).slice(0, 8);
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
      const artifactResults = artifactFuse.search(debouncedQuery).slice(0, 5);
      results.push(
        ...artifactResults.map((r) => ({
          type: 'artifact' as const,
          title: r.item.name,
          subtitle: `${r.item.quality} Artifact`,
          path: `/artifacts/${encodeURIComponent(r.item.name)}`,
          icon: getArtifactIcon(r.item.name) ?? IoDiamondOutline,
          color: 'teal',
        }))
      );
    }

    // Search gear
    if (gear.length > 0) {
      const gearFuse = new Fuse(gear, {
        keys: ['name', 'set', 'type', 'lore'],
        threshold: 0.3,
      });
      const gearResults = gearFuse.search(debouncedQuery).slice(0, 5);
      results.push(
        ...gearResults.map((r) => ({
          type: 'gear' as const,
          title: r.item.name,
          subtitle: `${r.item.type} • ${r.item.set}`,
          path: `/gear-sets/${encodeURIComponent(r.item.set)}`,
          icon: getGearIcon(r.item.type, r.item.name) ?? IoShieldOutline,
          color: 'teal',
        }))
      );
    }

    // Search pages
    const pageFuse = new Fuse(PAGES, {
      keys: ['title', 'keywords'],
      threshold: 0.4,
    });
    const pageResults = pageFuse.search(debouncedQuery).slice(0, 3);
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
      const effectResults = effectFuse.search(debouncedQuery).slice(0, 5);
      results.push(
        ...effectResults.map((r) => ({
          type: 'status-effect' as const,
          title: r.item.name,
          subtitle: r.item.type,
          path: '/status-effects',
          icon: getStatusEffectIcon(r.item.name) ?? IoSparklesOutline,
          color: 'cyan',
        }))
      );
    }

    // Search subclasses
    if (subclasses.length > 0) {
      const subclassFuse = new Fuse(subclasses, {
        keys: ['name', 'class', 'effect', 'bonuses'],
        threshold: 0.3,
      });
      const subclassResults = subclassFuse.search(debouncedQuery).slice(0, 5);
      results.push(
        ...subclassResults.map((r) => ({
          type: 'subclass' as const,
          title: r.item.name,
          subtitle: `${r.item.class} • Tier ${r.item.tier}`,
          path: '/subclasses',
          icon: getSubclassIcon(r.item.name, r.item.class) ?? IoGridOutline,
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
      const spellResults = spellFuse.search(debouncedQuery).slice(0, 5);
      results.push(
        ...spellResults.map((r) => ({
          type: 'wyrmspell' as const,
          title: r.item.name,
          subtitle: r.item.type,
          path: '/wyrmspells',
          icon: getWyrmspellIcon(r.item.name) ?? IoFlameOutline,
          color: 'indigo',
        }))
      );
    }

    // Search teams
    if (teams.length > 0) {
      const teamFuse = new Fuse(teams, {
        keys: ['name', 'description', 'members.character_name'],
        threshold: 0.3,
      });
      const teamResults = teamFuse.search(debouncedQuery).slice(0, 3);
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
      const howlkinResults = howlkinFuse.search(debouncedQuery).slice(0, 4);
      results.push(
        ...howlkinResults.map((r) => ({
          type: 'howlkin' as const,
          title: r.item.name,
          subtitle: `${r.item.quality} Howlkin`,
          path: '/howlkins',
          icon: getHowlkinIcon(r.item.name) ?? IoPawOutline,
          color: 'orange',
        }))
      );
    }

    // Search noble phantasms
    if (noblePhantasms.length > 0) {
      const npFuse = new Fuse(noblePhantasms, {
        keys: ['name', 'character', 'lore'],
        threshold: 0.3,
      });
      const npResults = npFuse.search(debouncedQuery).slice(0, 5);
      results.push(
        ...npResults.map((r) => ({
          type: 'noble-phantasm' as const,
          title: r.item.name,
          subtitle: r.item.character || 'Noble Phantasm',
          path: `/noble-phantasms/${encodeURIComponent(r.item.name)}`,
          icon: getNoblePhantasmIcon(r.item.name) ?? IoFlashOutline,
          color: 'teal',
        }))
      );
    }

    // Search resources
    if (resources.length > 0) {
      const resourceFuse = new Fuse(resources, {
        keys: ['name', 'description', 'category', 'quality'],
        threshold: 0.3,
      });
      const resourceResults = resourceFuse.search(debouncedQuery).slice(0, 5);
      results.push(
        ...resourceResults.map((r) => ({
          type: 'resource' as const,
          title: r.item.name,
          subtitle: `${r.item.category} • ${r.item.quality}`,
          path: '/resources',
          icon: getResourceIcon(r.item.name) ?? IoCubeOutline,
          color: 'teal',
        }))
      );
    }

    // Search codes
    if (codes.length > 0) {
      const codeFuse = new Fuse(codes, {
        keys: ['code'],
        threshold: 0.25,
      });
      const codeResults = codeFuse.search(debouncedQuery).slice(0, 4);
      results.push(
        ...codeResults.map((r) => ({
          type: 'code' as const,
          title: r.item.code,
          subtitle: isCodeActive(r.item) ? 'Active code' : 'Expired code',
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
      const linkResults = linksFuse.search(debouncedQuery).slice(0, 4);
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
      const tierListResults = tierListFuse.search(debouncedQuery).slice(0, 3);
      results.push(
        ...tierListResults.map((r) => ({
          type: 'tier-list' as const,
          title: r.item.name,
          subtitle: `${normalizeContentType(r.item.content_type, 'All')} • ${r.item.author}`,
          path: '/tier-list',
          icon: IoDocumentTextOutline,
          color: 'pink',
        }))
      );
    }

    return results.slice(0, 18);
  }, [
    debouncedQuery,
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
        <Tooltip label={searchShortcutHint} position="bottom" withArrow>
          <ActionIcon
            variant="subtle"
            size="lg"
            onClick={open}
            aria-label={searchShortcutHint}
          >
            <IoSearch size={18} />
          </ActionIcon>
        </Tooltip>
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
              borderBottom: '1px solid var(--mantine-color-default-border)',
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
                    aria-label="Clear search"
                  >
                    <IoClose size={16} />
                  </ActionIcon>
                ) : (
                  <Kbd size="sm">/</Kbd>
                )
              }
              styles={{
                input: {
                  border: 'none',
                  fontSize: 'var(--mantine-font-size-md)',
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
                const isSelected = index === selectedIndex;
                const isNewCategory =
                  index === 0 || searchResults[index - 1].type !== result.type;
                const isCharacterResult = result.type === 'character';
                return (
                  <Fragment key={`${result.type}-${result.title}-${index}`}>
                    {isNewCategory && (
                      <Text
                        size="xs"
                        c={result.color}
                        px="md"
                        pt="xs"
                        fw={600}
                        tt="uppercase"
                      >
                        {CATEGORY_LABELS[result.type]}
                      </Text>
                    )}
                    <UnstyledButton
                      onClick={() => handleSelect(result)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      p="md"
                      style={{
                        display: 'block',
                        width: '100%',
                        backgroundColor: isSelected
                          ? 'var(--mantine-color-default-hover)'
                          : 'transparent',
                        transition: `background-color ${TRANSITION.FAST}`,
                      }}
                    >
                      <Group wrap="nowrap" gap="md">
                        <Box
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: isCharacterResult ? '50%' : '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: isCharacterResult
                              ? 'transparent'
                              : `var(--mantine-color-${result.color}-1)`,
                            overflow: isCharacterResult ? 'visible' : 'hidden',
                            flexShrink: 0,
                          }}
                        >
                          {isCharacterResult ? (
                            <CharacterPortrait
                              name={result.title}
                              size={36}
                              borderWidth={0}
                            />
                          ) : typeof result.icon === 'string' ? (
                            <img
                              src={result.icon}
                              alt={result.title}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                objectPosition: 'top center',
                              }}
                            />
                          ) : (
                            (() => {
                              const Icon = result.icon;
                              return (
                                <Icon
                                  size={20}
                                  color={`var(--mantine-color-${result.color}-6)`}
                                />
                              );
                            })()
                          )}
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
                  </Fragment>
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
