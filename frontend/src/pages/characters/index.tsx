import {
  CharacterList,
  EmptyState,
  LastUpdated,
  ListPageShell,
  SuggestModal,
  type FieldDef,
} from '@/components';
import { CLASS_ORDER, QUALITY_ORDER } from '@/constants/colors';
import { CHARACTER_GRID_COLS } from '@/constants/ui';
import CharacterOwnershipManager from '@/features/characters/components/CharacterOwnershipManager';
import type { Character } from '@/features/characters/types';
import { useCharacterListData } from '@/features/characters/hooks/use-character-list-data';
import { buildCharacterNameCounts } from '@/features/characters/utils/character-route';
import { useDataFetch, useGradientAccent } from '@/hooks';
import { getLatestTimestamp } from '@/utils';
import { ActionIcon, Container, Group, Stack, Title, Tooltip } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useMemo } from 'react';
import { IoPeople, IoStar } from 'react-icons/io5';

const CHARACTER_FIELDS: FieldDef[] = [
  {
    name: 'name',
    label: 'Name',
    type: 'text',
    required: true,
    placeholder: 'Character name',
  },
  {
    name: 'title',
    label: 'Title',
    type: 'text',
    placeholder: 'Character title',
  },
  {
    name: 'quality',
    label: 'Quality',
    type: 'select',
    required: true,
    options: QUALITY_ORDER,
  },
  {
    name: 'character_class',
    label: 'Class',
    type: 'select',
    required: true,
    options: CLASS_ORDER,
  },
  {
    name: 'factions',
    label: 'Factions',
    type: 'text',
    placeholder: 'e.g. Elemental Echo, Wild Spirit',
  },
  { name: 'is_global', label: 'Available on Global server', type: 'boolean' },
  {
    name: 'additional_info',
    label: 'Additional Info (optional)',
    type: 'textarea',
    placeholder: 'Any extra details about this character',
  },
];

export default function Characters() {
  const { accent } = useGradientAccent();
  const {
    data: characters,
    loading,
    error,
  } = useDataFetch<Character[]>('data/characters.json', []);

  const mostRecentUpdate = useMemo(
    () => getLatestTimestamp(characters),
    [characters]
  );

  const characterNameCounts = useMemo(
    () => buildCharacterNameCounts(characters),
    [characters]
  );

  const listData = useCharacterListData(characters);

  const [managerOpened, { open: openManager, close: closeManager }] =
    useDisclosure(false);

  return (
    <Container size="lg" py={{ base: 'lg', sm: 'xl' }}>
      <Stack gap="md">
        <Group justify="space-between" align="center" wrap="wrap">
          <Group gap="sm" align="baseline">
            <Title order={1}>Characters</Title>
            <LastUpdated timestamp={mostRecentUpdate} />
          </Group>
          <Group gap="xs">
            <Tooltip label="Manage my characters">
              <ActionIcon
                variant="light"
                color={accent.primary}
                size="lg"
                onClick={openManager}
                aria-label="Manage my characters"
              >
                <IoStar size={16} />
              </ActionIcon>
            </Tooltip>
            <SuggestModal
              buttonLabel="Suggest a Character"
              modalTitle="Suggest a New Character"
              issueTitle="[Character] New character suggestion"
              fields={CHARACTER_FIELDS}
              excludeFromJson={['additional_info']}
            />
          </Group>
        </Group>

        <CharacterOwnershipManager
          characters={listData.filteredAndSorted}
          totalCharacters={characters.length}
          activeFilterCount={listData.activeFilterCount}
          opened={managerOpened}
          onClose={closeManager}
          characterNameCounts={characterNameCounts}
        />

        <ListPageShell
          loading={loading}
          error={error}
          errorTitle="Could not load characters"
          hasData={characters.length > 0}
          emptyMessage="No character data available yet."
          skeletonType="grid"
          skeletonCards={12}
          skeletonCardHeight={110}
          skeletonCols={CHARACTER_GRID_COLS}
        >
          {characters.length === 0 ? (
            <EmptyState
              icon={<IoPeople size={32} />}
              title="No characters yet"
              description="Character data will appear here once available."
              color={accent.primary}
            />
          ) : (
            <CharacterList data={listData} />
          )}
        </ListPageShell>
      </Stack>
    </Container>
  );
}
