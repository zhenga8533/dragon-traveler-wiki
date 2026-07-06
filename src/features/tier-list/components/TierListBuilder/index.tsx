import ConfirmActionModal from '@/components/ui/ConfirmActionModal';
import JsonModal from '@/components/tools/JsonModal';
import { getTierColor } from '@/constants/tier-colors';
import { STICKY_POOL_COLUMN_STYLE } from '@/constants/styles';
import { STORAGE_KEY } from '@/constants/ui';
import FilterableCharacterPool from '@/components/common/FilterableCharacterPool';
import type { Character } from '@/features/characters/types';
import {
  getCharacterIdentityKey,
} from '@/features/characters/utils/character-route';
import CharacterNoteButton from '@/components/common/CharacterNoteButton';
import { useTierListState } from '@/features/tier-list/hooks/use-tier-list-state';
import type { TierList } from '@/features/tier-list/types';
import { useDarkMode, useGradientAccent, useIsMobile } from '@/hooks';
import type { PoolLayout } from '@/hooks';
import { toEntitySlug } from '@/utils/entity-slug';
import { downloadElementAsImage } from '@/utils/export-image';
import { buildSuggestionIssueUrls } from '@/utils/github-issues';
import { showSuccessToast, showWarningToast } from '@/utils/toast';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { Box, Flex, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AddTierRow,
  DraggableCharCard,
  TierDropZone,
  TierListMetaFields,
  UnrankedPool,
} from './BuilderElements';
import { TierListExportView } from './ExportView';
import TierListBuilderToolbar from './TierListBuilderToolbar';

interface TierListBuilderProps {
  characters: Character[];
  charMap: Map<string, Character>;
  initialData?: TierList | null;
  poolLayout: PoolLayout;
  onPoolLayoutChange: (layout: PoolLayout) => void;
  canUseSidePoolLayout: boolean;
}

export default function TierListBuilder({
  characters,
  charMap,
  initialData,
  poolLayout: layout,
  onPoolLayoutChange: setLayout,
  canUseSidePoolLayout: canUseSideLayout,
}: TierListBuilderProps) {
  const { accent } = useGradientAccent();
  const [pasteModalOpened, { open: openPasteModal, close: closePasteModal }] =
    useDisclosure(false);
  const [
    clearConfirmOpened,
    { open: openClearConfirm, close: closeClearConfirm },
  ] = useDisclosure(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [pendingSaveOverwrite, setPendingSaveOverwrite] = useState<
    string | null
  >(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const isDark = useDarkMode();
  const isMobile = useIsMobile();
  const actionButtonSize = isMobile ? 'md' : 'sm';
  const {
    activeId,
    getCharacterFromKey,
    handleAddTier,
    handleAuthorCommit,
    handleCategoryChange,
    handleCharacterNoteChange,
    handleClear,
    handleDeleteTier,
    handleDescriptionCommit,
    handleDragEnd,
    handleDragStart,
    handleMoveTierDown,
    handleMoveTierUp,
    handleNameCommit,
    handlePasteApply,
    handleSort,
    handleTierNoteChange,
    hasAnyBuilderData,
    hasAnyPlaced,
    json,
    meta,
    notes,
    placements,
    tierDefs,
    tierExportRows,
    tierListData,
    unrankedCharacters,
  } = useTierListState({
    characters,
    charMap,
    initialData,
  });
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 120, tolerance: 8 },
    })
  );

  const { issueUrl: tierListIssueUrl, emptyIssueUrl: tierListEmptyIssueUrl } =
    useMemo(
      () =>
        buildSuggestionIssueUrls({
          title: '[Tier List] New tier list suggestion',
          json,
          entityType: 'tier list',
        }),
      [json]
    );

  function handleSubmitSuggestion() {
    if (!tierListIssueUrl) {
      window.open(tierListEmptyIssueUrl, '_blank');
      showWarningToast({
        title: 'Tier list JSON is too large',
        message:
          'Please copy the JSON using the Copy JSON button and paste it into the GitHub issue body.',
        autoClose: 8000,
      });
      return;
    }

    window.open(tierListIssueUrl, '_blank');
  }

  useEffect(() => {
    if (!isCapturing) return;
    const el = exportRef.current;
    if (!el) {
      setIsCapturing(false);
      return;
    }
    const run = async () => {
      await new Promise((r) => setTimeout(r, 150));
      try {
        await downloadElementAsImage(
          el,
          tierListData.name || 'tier-list',
          isDark
        );
      } finally {
        setIsCapturing(false);
      }
    };
    run();
  }, [isCapturing, isDark, tierListData.name]);

  function executeSaveToMySaved(key: string) {
    try {
      const now = Math.floor(Date.now() / 1000);
      const normalized: TierList = { ...tierListData, last_updated: now };
      const stored = window.localStorage.getItem(
        STORAGE_KEY.TIER_LIST_MY_SAVED
      );
      const saves: Record<string, TierList> = stored
        ? (JSON.parse(stored) as Record<string, TierList>)
        : {};
      saves[key] = normalized;
      window.localStorage.setItem(
        STORAGE_KEY.TIER_LIST_MY_SAVED,
        JSON.stringify(saves)
      );
      window.dispatchEvent(new CustomEvent('tier-list:saved-changed'));
      showSuccessToast({
        title: 'Saved!',
        message: `"${key}" saved to My Saved Tier Lists.`,
      });
    } catch {
      // ignore
    }
  }

  function handleSaveToMySaved() {
    try {
      const key = toEntitySlug(tierListData.name?.trim() || 'Untitled');
      const stored = window.localStorage.getItem(
        STORAGE_KEY.TIER_LIST_MY_SAVED
      );
      const saves: Record<string, TierList> = stored
        ? (JSON.parse(stored) as Record<string, TierList>)
        : {};
      if (saves[key]) {
        setPendingSaveOverwrite(key);
        return;
      }
      executeSaveToMySaved(key);
    } catch {
      // ignore
    }
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <Stack gap="md">
          <TierListMetaFields
            name={meta.name}
            author={meta.author}
            categoryName={meta.categoryName}
            description={meta.description}
            onNameCommit={handleNameCommit}
            onAuthorCommit={handleAuthorCommit}
            onCategoryChange={handleCategoryChange}
            onDescriptionCommit={handleDescriptionCommit}
          />

          <TierListBuilderToolbar
            json={json}
            hasAnyPlaced={hasAnyPlaced}
            hasAnyBuilderData={hasAnyBuilderData}
            isCapturing={isCapturing}
            onPasteOpen={openPasteModal}
            onSave={handleSaveToMySaved}
            onSort={handleSort}
            onExport={() => setIsCapturing(true)}
            onSubmit={handleSubmitSuggestion}
            onClear={openClearConfirm}
          />

          <Flex
            gap="md"
            align={layout === 'side' ? 'flex-start' : 'stretch'}
            direction={layout === 'side' ? 'row' : 'column'}
          >
            <Stack
              gap="md"
              style={layout === 'side' ? { flex: '3 3 0%', minWidth: 0 } : undefined}
            >
              {tierDefs.map((tierDef, index) => {
                const tier = tierDef.name;
                const names = placements[tier] || [];
                const color = getTierColor(tier, index);

                return (
                  <TierDropZone
                    key={tier}
                    id={`tier-${tier}`}
                    label={`${tier} Tier`}
                    color={color}
                    note={tierDef.note}
                    onNoteChange={(note) => handleTierNoteChange(tier, note)}
                    onDelete={() => handleDeleteTier(tier)}
                    onMoveUp={() => handleMoveTierUp(index)}
                    onMoveDown={() => handleMoveTierDown(index)}
                    isFirst={index === 0}
                    isLast={index === tierDefs.length - 1}
                    canDelete={tierDefs.length > 1}
                  >
                    {names.map((n) => {
                      const character = getCharacterFromKey(n);
                      return (
                        <Box
                          key={n}
                          style={{
                            position: 'relative',
                            display: 'inline-block',
                          }}
                        >
                          <DraggableCharCard
                            name={character?.name ?? n}
                            label={undefined}
                            charKey={n}
                            char={character}
                            tier={tier}
                            size={isMobile ? 56 : undefined}
                          />
                          <CharacterNoteButton
                            value={notes[n] || ''}
                            onCommit={(value) =>
                              handleCharacterNoteChange(n, value)
                            }
                            style={{
                              position: 'absolute',
                              top: 2,
                              left: 'calc(50% + 24px)',
                              transform: 'translateX(-50%)',
                            }}
                          />
                        </Box>
                      );
                    })}
                  </TierDropZone>
                );
              })}

              <AddTierRow
                existingNames={tierDefs.map((t) => t.name)}
                onAdd={handleAddTier}
                accentColor={accent.primary}
                size={actionButtonSize}
                isMobile={isMobile}
              />
            </Stack>

            <Box
              style={
                layout === 'side'
                  ? { flex: '2 2 0%', minWidth: 0, ...STICKY_POOL_COLUMN_STYLE }
                  : undefined
              }
            >
              <FilterableCharacterPool
                characters={unrankedCharacters}
                layout={layout}
                onLayoutChange={setLayout}
                canToggleLayout={canUseSideLayout}
              >
                {(filtered, filterHeader, paginationControl, cols) => (
                  <UnrankedPool
                    filterHeader={filterHeader}
                    paginationControl={paginationControl}
                    cols={cols}
                  >
                    {filtered.map((c) => {
                      return (
                        <DraggableCharCard
                          key={getCharacterIdentityKey(c)}
                          name={c.name}
                          label={undefined}
                          charKey={getCharacterIdentityKey(c)}
                          char={c}
                          size={isMobile ? 56 : undefined}
                        />
                      );
                    })}
                  </UnrankedPool>
                )}
              </FilterableCharacterPool>
            </Box>
          </Flex>
        </Stack>

        {typeof document !== 'undefined'
          ? createPortal(
              <DragOverlay dropAnimation={null}>
                {activeId
                  ? (() => {
                      const activeChar = getCharacterFromKey(activeId);
                      return (
                        <DraggableCharCard
                          name={activeChar?.name ?? activeId}
                          label={undefined}
                          charKey={activeId}
                          char={activeChar}
                          overlay
                        />
                      );
                    })()
                  : null}
              </DragOverlay>,
              document.body
            )
          : null}

        <JsonModal
          mode="paste"
          title="Paste Tier List JSON"
          description="Paste a tier list JSON object below to load it into the builder."
          placeholder={'{\n  "name": "...",\n  "entries": [...]\n}'}
          opened={pasteModalOpened}
          onClose={closePasteModal}
          onApply={handlePasteApply}
        />

        <ConfirmActionModal
          opened={clearConfirmOpened}
          onCancel={closeClearConfirm}
          title="Clear tier list builder?"
          message="This will remove all ranked characters, notes, custom tier changes, and metadata fields (name, author, category, and description) in the builder."
          confirmLabel="Clear All"
          confirmColor="red"
          onConfirm={() => {
            handleClear();
            closeClearConfirm();
          }}
        />

        <ConfirmActionModal
          opened={pendingSaveOverwrite !== null}
          onCancel={() => setPendingSaveOverwrite(null)}
          title="Overwrite saved tier list?"
          message={`A saved tier list named "${pendingSaveOverwrite ?? ''}" already exists. Overwrite it?`}
          confirmLabel="Overwrite"
          confirmColor="blue"
          onConfirm={() => {
            if (pendingSaveOverwrite)
              executeSaveToMySaved(pendingSaveOverwrite);
            setPendingSaveOverwrite(null);
          }}
        />
      </DndContext>

      {isCapturing && (
        <Box
          aria-hidden="true"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            opacity: 0,
            pointerEvents: 'none',
          }}
        >
          <Box
            ref={exportRef}
            style={{
              width: 900,
              backgroundColor: isDark ? '#1a1b1e' : '#ffffff',
              padding: 16,
            }}
          >
            <TierListExportView
              tierListName={tierListData.name || 'My Tier List'}
              author={meta.author || undefined}
              tierRows={tierExportRows}
            />
          </Box>
        </Box>
      )}
    </>
  );
}
