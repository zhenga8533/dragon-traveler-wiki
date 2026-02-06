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
  useMantineColorScheme,
} from '@mantine/core';
import { useDisclosure, useHotkeys } from '@mantine/hooks';
import Fuse from 'fuse.js';
import { useEffect, useMemo, useState } from 'react';
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
import type { Character } from '../types/character';
import type { StatusEffect } from '../types/status-effect';
import type { Team } from '../types/team';
import type { Wyrmspell } from '../types/wyrmspell';

type SearchResult = {
  type: 'character' | 'status-effect' | 'wyrmspell' | 'team' | 'page';
  title: string;
  subtitle?: string;
  path: string;
  icon: any;
  color: string;
};

const PAGES = [
  {
    title: 'Characters',
    path: '/characters',
    keywords: 'characters database hero heroes',
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
    title: 'Beginner Q&A',
    path: '/guides/beginner-qa',
    keywords: 'beginner guide faq help tutorial',
  },
  {
    title: 'Star Upgrade Calculator',
    path: '/guides/star-upgrade-calculator',
    keywords: 'calculator star upgrade cost',
  },
  {
    title: 'Efficient Spending',
    path: '/guides/efficient-spending',
    keywords: 'spending guide efficiency resources',
  },
  {
    title: 'Golden Clover Priority',
    path: '/guides/golden-clover-priority',
    keywords: 'golden clover priority shop',
  },
];

export default function SearchModal() {
  const [opened, { open, close }] = useDisclosure(false);
  const [query, setQuery] = useState('');
  const [characters, setCharacters] = useState<Character[]>([]);
  const [statusEffects, setStatusEffects] = useState<StatusEffect[]>([]);
  const [wyrmspells, setWyrmspells] = useState<Wyrmspell[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const { colorScheme } = useMantineColorScheme();

  useHotkeys([['mod+K', open]]);

  useEffect(() => {
    if (opened) {
      const baseUrl = import.meta.env.BASE_URL || '/';
      Promise.all([
        fetch(`${baseUrl}data/characters.json`).then((r) => r.json()),
        fetch(`${baseUrl}data/status-effects.json`).then((r) => r.json()),
        fetch(`${baseUrl}data/wyrmspells.json`).then((r) => r.json()),
        fetch(`${baseUrl}data/teams.json`).then((r) => r.json()),
      ])
        .then(([chars, effects, spells, teamData]) => {
          setCharacters(chars);
          setStatusEffects(effects);
          setWyrmspells(spells);
          setTeams(teamData);
        })
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

    return results.slice(0, 12);
  }, [query, characters, statusEffects, wyrmspells, teams]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchResults]);

  const handleSelect = (result: SearchResult) => {
    navigate(result.path);
    close();
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
      <ActionIcon variant="subtle" size="lg" onClick={open} aria-label="Search">
        <IoSearch size={18} />
      </ActionIcon>

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
              placeholder="Search characters, effects, pages..."
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
                Search characters, status effects, wyrmspells, teams, and pages
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
