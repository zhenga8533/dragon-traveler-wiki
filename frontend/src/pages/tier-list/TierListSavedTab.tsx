import {
  Button,
  Collapse,
  Paper,
  ScrollArea,
  Stack,
  Tabs,
  Text,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useContext } from 'react';
import { IoCreate } from 'react-icons/io5';
import EntityActionButtons from '../../components/common/EntityActionButtons';
import type { ChipFilterGroup } from '../../components/common/EntityFilter';
import EntityFilter from '../../components/common/EntityFilter';
import NoResultsSuggestions from '../../components/common/NoResultsSuggestions';
import TierListContent from '../../components/tier-list/TierListContent';
import { BREAKPOINTS } from '../../constants/ui';
import { GRADIENT_PALETTE_ACCENTS, GradientThemeContext } from '../../contexts';
import type { Character } from '../../types/character';
import type { TierList as TierListType } from '../../types/tier-list';

interface TierListSavedTabProps {
  savedTierLists: TierListType[];
  visibleSavedTierLists: TierListType[];
  resolveTierEntryCharacter: (
    entry: TierListType['entries'][number]
  ) => Character | null | undefined;
  characterNameCounts: Map<string, number>;
  viewMode: string;
  filterOpen: boolean;
  entityFilterGroups: ChipFilterGroup[];
  viewFilters: Record<string, string[]>;
  search: string;
  onFilterChange: (key: string, values: string[]) => void;
  onSearchChange: (value: string) => void;
  onClearFilters: () => void;
  onOpenFilters: () => void;
  onRequestEdit: (tierList: TierListType) => void;
  onRequestExport: (name: string) => void;
  isExporting: string | null;
  exportRefCallback: (name: string, node: HTMLDivElement | null) => void;
  onRequestDelete: (name: string) => void;
  onGoToBuilder: () => void;
  characterFilter: (character: Character) => boolean;
}

export default function TierListSavedTab({
  savedTierLists,
  visibleSavedTierLists,
  resolveTierEntryCharacter,
  characterNameCounts,
  viewMode,
  filterOpen,
  entityFilterGroups,
  viewFilters,
  search,
  onFilterChange,
  onSearchChange,
  onClearFilters,
  onOpenFilters,
  onRequestEdit,
  onRequestExport,
  isExporting,
  exportRefCallback,
  onRequestDelete,
  onGoToBuilder,
  characterFilter,
}: TierListSavedTabProps) {
  const isMobile = useMediaQuery(BREAKPOINTS.MOBILE);
  const { palette } = useContext(GradientThemeContext);
  const accent = GRADIENT_PALETTE_ACCENTS[palette];

  const filterPanel = (
    <Collapse in={filterOpen}>
      <Paper p="sm" radius="md" withBorder bg="var(--mantine-color-body)">
        <EntityFilter
          groups={entityFilterGroups}
          selected={viewFilters}
          onChange={onFilterChange}
          onClear={onClearFilters}
          search={search}
          onSearchChange={onSearchChange}
          searchPlaceholder="Search saved tier lists..."
        />
      </Paper>
    </Collapse>
  );

  if (savedTierLists.length === 0) {
    return (
      <Paper p="xl" radius="md" withBorder>
        <Stack align="center" gap="sm">
          <Text c="dimmed">No saved tier lists yet.</Text>
          <Text size="xs" c="dimmed">
            Use the &ldquo;Create Your Own&rdquo; tab to build and save a tier
            list.
          </Text>
          <Button
            variant="light"
            color={accent.primary}
            size="sm"
            leftSection={<IoCreate size={16} />}
            onClick={onGoToBuilder}
          >
            Go to Builder
          </Button>
        </Stack>
      </Paper>
    );
  }

  if (visibleSavedTierLists.length === 0) {
    return (
      <>
        {filterPanel}

        <NoResultsSuggestions
          title={
            search
              ? 'No saved tier lists found'
              : 'No matching saved tier lists'
          }
          message={
            search
              ? 'No saved tier lists match your search.'
              : 'No saved tier lists match the current filters.'
          }
          onReset={onClearFilters}
          onOpenFilters={onOpenFilters}
        />
      </>
    );
  }

  return (
    <>
      {filterPanel}

      <Tabs defaultValue={visibleSavedTierLists[0]?.name}>
        <ScrollArea type="auto" scrollbarSize={5} offsetScrollbars>
          <Tabs.List style={{ flexWrap: 'nowrap', minWidth: 'max-content' }}>
            {visibleSavedTierLists.map((tl) => (
              <Tabs.Tab key={tl.name} value={tl.name} style={{ minHeight: 40 }}>
                {tl.name || 'Untitled'}
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </ScrollArea>

        {visibleSavedTierLists.map((tierList) => {
          const headerActions = (
            <EntityActionButtons
              onEdit={() => onRequestEdit(tierList)}
              onExport={() => onRequestExport(tierList.name)}
              isExporting={isExporting === tierList.name}
              onDelete={() => onRequestDelete(tierList.name)}
              size={isMobile ? 'xs' : 'compact-xs'}
              variant="light"
            />
          );

          return (
            <Tabs.Panel key={tierList.name} value={tierList.name} pt="md">
              <TierListContent
                tierList={tierList}
                resolveTierEntryCharacter={resolveTierEntryCharacter}
                characterNameCounts={characterNameCounts}
                viewMode={viewMode}
                headerActions={headerActions}
                exportRefCallback={(node) =>
                  exportRefCallback(tierList.name, node)
                }
                characterFilter={characterFilter}
              />
            </Tabs.Panel>
          );
        })}
      </Tabs>
    </>
  );
}
