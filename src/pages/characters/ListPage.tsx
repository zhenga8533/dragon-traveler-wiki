import {
  CharacterList,
  EmptyState,
  LastUpdated,
  ListPageShell,
  SuggestModal,
} from '@/components';
import { CHARACTER_FIELDS } from '@/features/characters/form-fields';
import { CHARACTER_GRID_COLS } from '@/constants/ui';
import CharacterOwnershipManager from '@/features/characters/components/CharacterOwnershipManager';
import type { Character } from '@/features/characters/types';
import { useCharacterListData } from '@/features/characters/hooks/use-character-list-data';
import { useNewCharacters } from '@/features/characters/hooks/use-new-characters';
import { buildCharacterNameCounts } from '@/features/characters/utils/character-route';
import { useDataFetch, useGradientAccent, useIsMobile } from '@/hooks';
import { getLatestTimestamp } from '@/utils';
import { ActionIcon, Button, Container, Group, Stack, Title, Tooltip } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useMemo } from 'react';
import { IoPeople, IoPersonOutline } from 'react-icons/io5';

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
  const newCharacterKeys = useNewCharacters();
  const isMobile = useIsMobile();

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
            {isMobile ? (
              <Tooltip label="My Characters">
                <ActionIcon
                  variant="light"
                  color={accent.primary}
                  size="lg"
                  onClick={openManager}
                  aria-label="My Characters"
                >
                  <IoPersonOutline size={16} />
                </ActionIcon>
              </Tooltip>
            ) : (
              <Button
                variant="light"
                color={accent.primary}
                size="xs"
                leftSection={<IoPersonOutline size={16} />}
                onClick={openManager}
                aria-label="My Characters"
              >
                My Characters
              </Button>
            )}
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
            <CharacterList data={listData} newCharacterKeys={newCharacterKeys} />
          )}
        </ListPageShell>
      </Stack>
    </Container>
  );
}
