import { QUALITY_ORDER } from '@/constants/colors';
import { CharacterOwnershipContext } from '@/contexts';
import type { Character } from '@/features/characters/types';
import {
  getCharacterBaseSlug,
  getCharacterIdentityKey,
  getCharacterRoutePath,
} from '@/features/characters/utils/character-route';
import { useGradientAccent, useStarLevels } from '@/hooks';
import { buildStarLevels } from '@/types/star-level';
import {
  ActionIcon,
  Button,
  CloseButton,
  Divider,
  Group,
  Modal,
  ScrollArea,
  Select,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useContext, useMemo, useState } from 'react';
import { IoBarChart, IoFilter, IoSearch, IoStar } from 'react-icons/io5';
import CharacterPortrait from './CharacterPortrait';
import StarLevelBubbleChart from './StarLevelBubbleChart';

interface CharacterOwnershipManagerProps {
  characters: Character[];
  totalCharacters: number;
  activeFilterCount: number;
  opened: boolean;
  onClose: () => void;
  /** Passed down for correct portrait routing when multiple variants share a name. */
  characterNameCounts: Map<string, number>;
}

export default function CharacterOwnershipManager({
  characters,
  totalCharacters,
  activeFilterCount,
  opened,
  onClose,
  characterNameCounts,
}: CharacterOwnershipManagerProps) {
  const { ownedCharacters, setCharacterStarLevel } = useContext(
    CharacterOwnershipContext
  );
  const { accent } = useGradientAccent();
  const { data: rawStarLevels } = useStarLevels();
  const starLevels = useMemo(() => buildStarLevels(rawStarLevels), [rawStarLevels]);
  const starLevelOptions = useMemo(
    () => [
      { value: '', label: 'Not owned' },
      ...starLevels.map((l) => ({ value: l.value, label: l.label })),
    ],
    [starLevels]
  );

  const [search, setSearch] = useState('');
  const [chartOpened, { open: openChart, close: closeChart }] = useDisclosure(false);

  const grouped = useMemo(() => {
    const lower = search.toLowerCase();
    const filtered = lower
      ? characters.filter((c) => c.name.toLowerCase().includes(lower))
      : characters;
    return QUALITY_ORDER.map((quality) => ({
      quality,
      chars: filtered.filter((c) => c.quality === quality),
    })).filter((g) => g.chars.length > 0);
  }, [characters, search]);

  const ownedCount = Object.keys(ownedCharacters).length;

  return (
    <>
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IoStar />
          <Text fw={600}>My Characters</Text>
          {ownedCount > 0 && (
            <Text size="sm" c="dimmed">
              ({ownedCount} owned)
            </Text>
          )}
          {ownedCount > 0 && (
            <Tooltip label="View investment chart" withArrow>
              <ActionIcon
                variant="light"
                color={accent.primary}
                size="sm"
                onClick={openChart}
                aria-label="View investment chart"
              >
                <IoBarChart size={14} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      }
      size="lg"
      scrollAreaComponent={ScrollArea.Autosize}
      lockScroll={false}
    >
      <Stack gap="md">
        <TextInput
          placeholder="Search characters…"
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          leftSection={<IoSearch size={14} />}
          rightSection={
            search ? <CloseButton size="sm" onClick={() => setSearch('')} /> : null
          }
        />

        {activeFilterCount > 0 && (
          <Group gap="xs">
            <IoFilter size={13} />
            <Text size="xs" c="dimmed">
              Showing {characters.length} of {totalCharacters} characters — filtered by the Characters page.
            </Text>
          </Group>
        )}

        {grouped.length === 0 ? (
          <Text c="dimmed" size="sm" ta="center" py="md">
            No characters match your search.
          </Text>
        ) : (
          grouped.map(({ quality, chars }) => (
            <Stack key={quality} gap={4}>
              <Divider
                label={
                  <Text size="xs" fw={600} c="dimmed">
                    {quality} ({chars.length})
                  </Text>
                }
                labelPosition="left"
              />
              {chars.map((char) => {
                const identityKey = getCharacterIdentityKey(char);
                const currentLevel = ownedCharacters[identityKey] ?? '';
                const isMultiQuality =
                  (characterNameCounts.get(getCharacterBaseSlug(char.name)) ?? 1) > 1;
                const displayName = isMultiQuality
                  ? `${char.name} (${char.quality})`
                  : char.name;
                return (
                  <Group key={identityKey} gap="sm" wrap="nowrap">
                    <CharacterPortrait
                      name={char.name}
                      quality={char.quality}
                      size={36}
                      borderWidth={2}
                      routePath={getCharacterRoutePath(char, characterNameCounts)}
                      link
                    />
                    <Text size="sm" fw={500} style={{ flex: 1, minWidth: 0 }} truncate>
                      {displayName}
                    </Text>
                    <Select
                      data={starLevelOptions}
                      value={currentLevel}
                      onChange={(val) =>
                        setCharacterStarLevel(identityKey, val || null)
                      }
                      size="xs"
                      w={130}
                      clearable
                      comboboxProps={{ withinPortal: true }}
                    />
                  </Group>
                );
              })}
            </Stack>
          ))
        )}

        {ownedCount > 0 && (
          <Group justify="flex-end" pt="xs">
            <Button
              variant="subtle"
              color="red"
              size="xs"
              onClick={() =>
                Object.keys(ownedCharacters).forEach((key) =>
                  setCharacterStarLevel(key, null)
                )
              }
            >
              Clear All
            </Button>
          </Group>
        )}
      </Stack>
    </Modal>

    <StarLevelBubbleChart
      characters={characters}
      opened={chartOpened}
      onClose={closeChart}
    />
    </>
  );
}
